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
      commaSepTrail1($.alias_expression),
      optional($.from_clause),
      optional($.where_clause),
      optional($.group_by_clause),
      optional($.order_by_clause)
    )),

    from_clause: $ => seq(
      $.keyword_from,
      commaSep1($.table_expression)
    ),
    where_clause: $ => seq($.keyword_where, $.expression),
    group_by_clause: $ => seq($.keyword_group, $.keyword_by, commaSep1($.expression)),
    order_by_clause: $ => seq($.keyword_order, $.keyword_by, commaSep1($.order_expression)),
    pipe_group_by_clause: $ => seq(
      $.keyword_group,
      $.keyword_by,
      commaSepTrail1($.expression)
    ),
    // --- Pipe Operations ---

    pipe_operation: $ => seq(
      '|>',
      choice(
        $.pipe_select, $.pipe_extend, $.pipe_set, $.pipe_drop,
        $.pipe_rename, $.pipe_where, $.pipe_aggregate, $.pipe_join,
        $.pipe_limit, $.pipe_order_by, $.pipe_window, $.pipe_call
      )
    ),

    pipe_select: $ => seq($.keyword_select, optional($.keyword_distinct), commaSepTrail1($.alias_expression)),
    pipe_extend: $ => seq($.keyword_extend, commaSepTrail1($.alias_expression)),
    pipe_set: $ => seq($.keyword_set, commaSepTrail1($.alias_expression)),
    pipe_drop: $ => seq($.keyword_drop, commaSepTrail1($.identifier)),
    pipe_rename: $ => seq($.keyword_rename, commaSepTrail1(seq($.identifier, $.keyword_as, $.identifier))),
    pipe_aggregate: $ => seq(
      $.keyword_aggregate,
      commaSepTrail1($.alias_expression),
      optional($.pipe_group_by_clause) // <--- Use the named rule
    ),
    pipe_where: $ => seq($.keyword_where, $.expression),

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
    pipe_order_by: $ => seq($.keyword_order, $.keyword_by, commaSepTrail1($.order_expression)),
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
      $.between_expression,
      $.in_expression,
      $.like_expression,
      $.case_expression,
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
    // x [NOT] BETWEEN y AND z
    between_expression: $ => prec.left(seq(
      $.expression,
      optional($.keyword_not),
      $.keyword_between,
      $.expression, // Lower bound
      $.keyword_and,
      $.expression  // Upper bound
    )),

    // x [NOT] IN (a, b, c)  OR  x [NOT] IN (SELECT ...)
    in_expression: $ => prec.left(seq(
      $.expression,
      optional($.keyword_not),
      $.keyword_in,
      '(',
      choice(
        commaSep1($.expression),
        $.query_expression // Logic for subqueries
      ),
      ')'
    )),

    // x [NOT] LIKE y
    like_expression: $ => prec.left(seq(
      $.expression,
      optional($.keyword_not),
      $.keyword_like,
      $.expression
    )),

    // CASE WHEN x THEN y ELSE z END
    case_expression: $ => seq(
      $.keyword_case,
      // "Simple" case (CASE x ...) or "Searched" case (CASE WHEN ...)
      optional($.expression),
      repeat1($.when_clause),
      optional($.else_clause),
      $.keyword_end
    ),

    when_clause: $ => seq(
      $.keyword_when,
      $.expression,
      $.keyword_then,
      $.expression
    ),

    else_clause: $ => seq(
      $.keyword_else,
      $.expression
    ),

    parenthesized_expression: $ => seq('(', $.expression, ')'),
    function_name: $ => $.identifier,

    identifier: $ => token(prec(-1, choice(
      /[a-zA-Z_][a-zA-Z0-9_.]*/, // Standard unquoted
      /`([^`]|``)*`/             // Quoted
    ))),

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
    keyword_between: $ => token(caseInsensitive('BETWEEN')),
    keyword_in: $ => token(caseInsensitive('IN')),
    keyword_like: $ => token(caseInsensitive('LIKE')),
    keyword_case: $ => token(caseInsensitive('CASE')),
    keyword_when: $ => token(caseInsensitive('WHEN')),
    keyword_then: $ => token(caseInsensitive('THEN')),
    keyword_else: $ => token(caseInsensitive('ELSE')),
    keyword_end: $ => token(caseInsensitive('END')),
  }
});

// Strict: No trailing comma allowed (e.g., Standard SQL GROUP BY)
function commaSep1(rule) {
  return seq(rule, repeat(seq(',', rule)));
}

// Trailing: Optional trailing comma allowed (e.g., Pipe syntax SELECT, EXTEND)
function commaSepTrail1(rule) {
  return seq(
    rule,
    repeat(seq(',', rule)),
    optional(',')
  );
}

function caseInsensitive(keyword) {
  return new RegExp(keyword.split('').map(l => `[${l.toLowerCase()}${l.toUpperCase()}]`).join(''));
}
