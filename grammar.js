const CASE_INSENSITIVE = (keyword) => {
  return new RegExp(keyword.split('').map(l => `[${l.toLowerCase()}${l.toUpperCase()}]`).join(''));
}

module.exports = grammar({
  name: 'googlesql_pipe',

  extras: $ => [
    /\s/,
    $.comment,
  ],

  conflicts: $ => [
    [$.expression, $.function_call],
    [$.identifier, $.function_name]
  ],

  rules: {
    source_file: $ => repeat($.statement),

    statement: $ => seq(
      $.query_expression,
      optional(';')
    ),

    // A query can be a standard SELECT or a standalone FROM clause, 
    // optionally followed by a chain of pipe operators.
    query_expression: $ => seq(
      choice(
        $.select_statement,
        $.from_clause
      ),
      repeat($.pipe_operation)
    ),

    // --- Standard SQL Starters ---

    select_statement: $ => seq(
      CASE_INSENSITIVE('SELECT'),
      optional(CASE_INSENSITIVE('DISTINCT')),
      commaSep1($.expression),
      optional($.from_clause),
      optional($.where_clause),
      optional($.group_by_clause),
      optional($.order_by_clause)
    ),

    from_clause: $ => seq(
      CASE_INSENSITIVE('FROM'),
      $.table_expression
    ),

    where_clause: $ => seq(
      CASE_INSENSITIVE('WHERE'),
      $.expression
    ),

    group_by_clause: $ => seq(
      CASE_INSENSITIVE('GROUP'),
      CASE_INSENSITIVE('BY'),
      commaSep1($.expression)
    ),

    order_by_clause: $ => seq(
      CASE_INSENSITIVE('ORDER'),
      CASE_INSENSITIVE('BY'),
      commaSep1($.order_expression)
    ),

    // --- Pipe Syntax ---

    pipe_operation: $ => seq(
      '|>',
      choice(
        $.pipe_select,
        $.pipe_extend,
        $.pipe_set,
        $.pipe_drop,
        $.pipe_rename,
        $.pipe_where,
        $.pipe_aggregate,
        $.pipe_join,
        $.pipe_limit,
        $.pipe_order_by,
        $.pipe_window,
        $.pipe_call
      )
    ),

    pipe_select: $ => seq(
      CASE_INSENSITIVE('SELECT'),
      optional(CASE_INSENSITIVE('DISTINCT')),
      commaSep1($.alias_expression)
    ),

    pipe_extend: $ => seq(
      CASE_INSENSITIVE('EXTEND'),
      commaSep1($.alias_expression)
    ),

    pipe_set: $ => seq(
      CASE_INSENSITIVE('SET'),
      commaSep1($.alias_expression)
    ),

    pipe_drop: $ => seq(
      CASE_INSENSITIVE('DROP'),
      commaSep1($.identifier)
    ),

    pipe_rename: $ => seq(
      CASE_INSENSITIVE('RENAME'),
      commaSep1(seq($.identifier, CASE_INSENSITIVE('AS'), $.identifier))
    ),

    pipe_where: $ => seq(
      CASE_INSENSITIVE('WHERE'),
      $.expression
    ),

    pipe_aggregate: $ => seq(
      CASE_INSENSITIVE('AGGREGATE'),
      commaSep1($.alias_expression),
      optional($.group_by_clause)
    ),

    pipe_join: $ => seq(
      choice(
        CASE_INSENSITIVE('JOIN'),
        seq(CASE_INSENSITIVE('INNER'), CASE_INSENSITIVE('JOIN')),
        seq(CASE_INSENSITIVE('LEFT'), optional(CASE_INSENSITIVE('OUTER')), CASE_INSENSITIVE('JOIN')),
        seq(CASE_INSENSITIVE('RIGHT'), optional(CASE_INSENSITIVE('OUTER')), CASE_INSENSITIVE('JOIN')),
        seq(CASE_INSENSITIVE('FULL'), optional(CASE_INSENSITIVE('OUTER')), CASE_INSENSITIVE('JOIN')),
        seq(CASE_INSENSITIVE('CROSS'), CASE_INSENSITIVE('JOIN'))
      ),
      $.table_expression,
      optional($.join_condition)
    ),

    pipe_limit: $ => seq(
      CASE_INSENSITIVE('LIMIT'),
      $.number,
      optional(seq(CASE_INSENSITIVE('OFFSET'), $.number))
    ),

    pipe_order_by: $ => seq(
      CASE_INSENSITIVE('ORDER'),
      CASE_INSENSITIVE('BY'),
      commaSep1($.order_expression)
    ),

    pipe_window: $ => seq(
      CASE_INSENSITIVE('WINDOW'),
      $.expression // Simplified for brevity
    ),

    pipe_call: $ => seq(
      CASE_INSENSITIVE('CALL'),
      $.function_call
    ),

    // --- Basic Expressions & Primitives ---

    table_expression: $ => seq(
      choice($.identifier, $.function_call), // e.g., tableName or UNNEST(...)
      optional(seq(CASE_INSENSITIVE('AS'), $.identifier))
    ),

    join_condition: $ => choice(
      seq(CASE_INSENSITIVE('ON'), $.expression),
      seq(CASE_INSENSITIVE('USING'), '(', commaSep1($.identifier), ')')
    ),

    // Alias expression: "expr [AS alias]" or "alias = expr" (standard SQL vs some pipe contexts)
    // ZetaSQL pipe EXTEND/SET usually uses "expr AS alias"
    alias_expression: $ => seq(
      $.expression,
      optional(seq(CASE_INSENSITIVE('AS'), $.identifier))
    ),

    order_expression: $ => seq(
      $.expression,
      optional(choice(CASE_INSENSITIVE('ASC'), CASE_INSENSITIVE('DESC')))
    ),

    expression: $ => choice(
      $.identifier,
      $.number,
      $.string,
      $.function_call,
      $.binary_expression,
      $.parenthesized_expression,
      $.star
    ),

    function_call: $ => seq(
      field('name', $.function_name),
      '(',
      optional(choice($.star, commaSep1($.expression))),
      ')',
      optional($.over_clause)
    ),

    over_clause: $ => seq(
      CASE_INSENSITIVE('OVER'),
      '(',
      optional(seq(CASE_INSENSITIVE('PARTITION'), CASE_INSENSITIVE('BY'), commaSep1($.expression))),
      optional($.order_by_clause),
      ')'
    ),

    binary_expression: $ => prec.left(1, seq(
      $.expression,
      choice('=', '<', '>', '<=', '>=', '<>', '+', '-', '*', '/', CASE_INSENSITIVE('AND'), CASE_INSENSITIVE('OR')),
      $.expression
    )),

    parenthesized_expression: $ => seq('(', $.expression, ')'),

    function_name: $ => $.identifier,
    identifier: $ => /[a-zA-Z_][a-zA-Z0-9_.]*/,
    number: $ => /\d+/,
    string: $ => /'[^']*'|"[^"]*"/,
    star: $ => '*',
    
    comment: $ => token(choice(
      seq('--', /.*/),
      seq('#', /.*/),
      seq('/*', /[^*]*\*+([^/*][^*]*\*+)*/, '/')
    )),
  }
});

function commaSep1(rule) {
  return seq(rule, repeat(seq(',', rule)));
}
