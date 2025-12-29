module.exports = grammar({
  name: 'googlesql_pipe',

  extras: $ => [/\s/, $.comment],

  conflicts: $ => [
    [$.expression, $.function_call]
  ],

  rules: {
    source_file: $ => repeat($.statement),
    statement: $ => seq(
      optional($.with_clause),
      $.query_expression,
      optional(';')
    ),

    query_expression: $ => seq(
      choice($.select_statement, $.from_clause),
      repeat($.pipe_operation)
    ),

    with_clause: $ => seq(
      $.keyword_with,
      optional($.keyword_recursive),
      commaSep1($.cte_definition)
    ),

    cte_definition: $ => seq(
      $.identifier,
      $.keyword_as,
      '(',
      $.query_expression, // CTEs can contain full pipe or standard queries
      ')'
    ),

    // --- High-Level Statements ---

    select_statement: $ => prec.right(seq(
      $.keyword_select,
      optional($.keyword_distinct),
      commaSep1($.alias_expression),
      optional($.from_clause),
      optional($.where_clause),
      optional($.group_by_clause),
      optional($.order_by_clause)
    )),

    from_clause: $ => seq($.keyword_from, $.table_expression),
    where_clause: $ => seq($.keyword_where, $.expression),
    group_by_clause: $ => seq($.keyword_group, $.keyword_by, commaSep1($.expression)),
    order_by_clause: $ => seq($.keyword_order, $.keyword_by, commaSep1($.order_expression)),

    // --- Pipe Operations ---

    pipe_operation: $ => seq(
      '|>',
      choice(
        $.pipe_select, $.pipe_extend, $.pipe_set, $.pipe_drop,
        $.pipe_rename, $.pipe_where, $.pipe_aggregate, $.pipe_join,
        $.pipe_limit, $.pipe_order_by, $.pipe_window, $.pipe_call
      )
    ),

    pipe_select: $ => seq($.keyword_select, optional($.keyword_distinct), commaSep1($.alias_expression)),
    pipe_extend: $ => seq($.keyword_extend, commaSep1($.alias_expression)),
    pipe_set: $ => seq($.keyword_set, commaSep1($.alias_expression)),
    pipe_drop: $ => seq($.keyword_drop, commaSep1($.identifier)),
    pipe_rename: $ => seq($.keyword_rename, commaSep1(seq($.identifier, $.keyword_as, $.identifier))),
    pipe_where: $ => seq($.keyword_where, $.expression),
    pipe_aggregate: $ => seq($.keyword_aggregate, commaSep1($.alias_expression), optional($.group_by_clause)),

    pipe_join: $ => seq(
      choice(
        $.keyword_join,
        seq($.keyword_inner, $.keyword_join),
        seq($.keyword_left, optional($.keyword_outer), $.keyword_join),
        seq($.keyword_right, optional($.keyword_outer), $.keyword_join),
        seq($.keyword_full, optional($.keyword_outer), $.keyword_join),
        seq($.keyword_cross, $.keyword_join)
      ),
      $.table_expression,
      optional($.join_condition)
    ),

    pipe_limit: $ => seq($.keyword_limit, $.number, optional(seq($.keyword_offset, $.number))),
    pipe_order_by: $ => seq($.keyword_order, $.keyword_by, commaSep1($.order_expression)),
    pipe_window: $ => seq($.keyword_window, $.expression),
    pipe_call: $ => seq($.keyword_call, $.function_call),

    // --- Expressions ---

    is_expression: $ => prec.left(1, seq(
      $.expression,
      $.keyword_is,
      optional($.keyword_not),
      choice($.keyword_null, $.boolean)
    )),

    table_expression: $ => seq(
      choice($.identifier, $.function_call),
      optional(seq($.keyword_as, $.identifier))
    ),

    join_condition: $ => choice(
      seq($.keyword_on, $.expression),
      seq($.keyword_using, '(', commaSep1($.identifier), ')')
    ),

    alias_expression: $ => seq(
      $.expression,
      optional(seq($.keyword_as, $.identifier))
    ),

    order_expression: $ => seq(
      $.expression,
      optional(choice($.keyword_asc, $.keyword_desc))
    ),

    expression: $ => choice(
      $.identifier, $.number, $.string, $.boolean, $.function_call,
      $.binary_expression, $.is_expression,
      $.parenthesized_expression, $.star
    ),

    function_call: $ => seq(
      field('name', $.function_name),
      '(',
      optional(choice($.star, commaSep1($.expression))),
      ')',
      optional($.over_clause)
    ),

    over_clause: $ => seq(
      $.keyword_over,
      '(',
      optional(seq($.keyword_partition, $.keyword_by, commaSep1($.expression))),
      optional($.order_by_clause),
      ')'
    ),

    binary_expression: $ => prec.left(1, seq(
      $.expression,
      choice('=', '<', '>', '<=', '>=', '<>', '+', '-', '*', '/', $.keyword_and, $.keyword_or),
      $.expression
    )),

    parenthesized_expression: $ => seq('(', $.expression, ')'),
    function_name: $ => $.identifier,
    identifier: $ => choice(
      // Standard unquoted: letters, numbers, underscores, and dots (for simple paths)
      /[a-zA-Z_][a-zA-Z0-9_.]*/,

      // Quoted with backticks: allows any character except backtick, 
      // or a double backtick "``" to escape.
      /`([^`]|``)*`/
    ),
    number: $ => /\d+/,
    string: $ => /'[^']*'|"[^"]*"/,
    star: $ => '*',
    boolean: $ => choice($.keyword_true, $.keyword_false),

    comment: $ => token(choice(
      seq('--', /.*/),
      seq('#', /.*/),
      seq('/*', /[^*]*\*+([^/*][^*]*\*+)*/, '/')
    )),

    // --- Keywords Definitions ---
    // We strictly name the rules "keyword_X". This guarantees the node name is "keyword_X".

    keyword_select: $ => token(caseInsensitive('SELECT')),
    keyword_from: $ => token(caseInsensitive('FROM')),
    keyword_where: $ => token(caseInsensitive('WHERE')),
    keyword_group: $ => token(caseInsensitive('GROUP')),
    keyword_by: $ => token(caseInsensitive('BY')),
    keyword_order: $ => token(caseInsensitive('ORDER')),
    keyword_extend: $ => token(caseInsensitive('EXTEND')),
    keyword_set: $ => token(caseInsensitive('SET')),
    keyword_drop: $ => token(caseInsensitive('DROP')),
    keyword_rename: $ => token(caseInsensitive('RENAME')),
    keyword_aggregate: $ => token(caseInsensitive('AGGREGATE')),
    keyword_join: $ => token(caseInsensitive('JOIN')),
    keyword_inner: $ => token(caseInsensitive('INNER')),
    keyword_outer: $ => token(caseInsensitive('OUTER')),
    keyword_left: $ => token(caseInsensitive('LEFT')),
    keyword_right: $ => token(caseInsensitive('RIGHT')),
    keyword_full: $ => token(caseInsensitive('FULL')),
    keyword_cross: $ => token(caseInsensitive('CROSS')),
    keyword_on: $ => token(caseInsensitive('ON')),
    keyword_using: $ => token(caseInsensitive('USING')),
    keyword_limit: $ => token(caseInsensitive('LIMIT')),
    keyword_offset: $ => token(caseInsensitive('OFFSET')),
    keyword_call: $ => token(caseInsensitive('CALL')),
    keyword_window: $ => token(caseInsensitive('WINDOW')),
    keyword_as: $ => token(caseInsensitive('AS')),
    keyword_distinct: $ => token(caseInsensitive('DISTINCT')),
    keyword_over: $ => token(caseInsensitive('OVER')),
    keyword_partition: $ => token(caseInsensitive('PARTITION')),
    keyword_and: $ => token(caseInsensitive('AND')),
    keyword_or: $ => token(caseInsensitive('OR')),
    keyword_asc: $ => token(caseInsensitive('ASC')),
    keyword_desc: $ => token(caseInsensitive('DESC')),
    keyword_with: $ => token(caseInsensitive('WITH')),
    keyword_recursive: $ => token(caseInsensitive('RECURSIVE')),
    keyword_is: $ => token(caseInsensitive('IS')),
    keyword_not: $ => token(caseInsensitive('NOT')),
    keyword_null: $ => token(caseInsensitive('NULL')),
    keyword_true: $ => token(caseInsensitive('TRUE')),
    keyword_false: $ => token(caseInsensitive('FALSE')),

  }
});

function commaSep1(rule) { return seq(rule, repeat(seq(',', rule))); }

function caseInsensitive(keyword) {
  return new RegExp(keyword.split('').map(l => `[${l.toLowerCase()}${l.toUpperCase()}]`).join(''));
}
