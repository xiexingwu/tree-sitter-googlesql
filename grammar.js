const PREC = {
  or: 1,
  and: 2,
  not: 3,
  compare: 4,
  bitor: 5,
  bitxor: 6,
  bitand: 7,
  shift: 8,
  add: 9,
  mult: 10,
  unary: 11,
  postfix: 12,
};

// Keywords that may still be used as identifiers (DATE(ts), Timestamp column, ...)
const UNRESERVED = ['DATE', 'DATETIME', 'TIME', 'TIMESTAMP', 'NUMERIC', 'BIGNUMERIC', 'JSON'];

const NEW_KEYWORDS = [
  ...UNRESERVED, 'RANGE',
  'CAST', 'SAFE_CAST', 'FORMAT', 'EXTRACT', 'AT', 'INTERVAL', 'TO', 'ARRAY', 'STRUCT', 'EXISTS',
  'UNION', 'INTERSECT', 'EXCEPT', 'ALL', 'VALUE', 'REPLACE', 'QUALIFY', 'UNNEST', 'UNPIVOT',
  'INCLUDE', 'EXCLUDE', 'SYSTEM_TIME', 'OF', 'FIRST', 'LAST',
  'CREATE', 'TEMP', 'TEMPORARY', 'EXTERNAL', 'TABLE', 'IF', 'MATERIALIZED', 'VIEW', 'FUNCTION',
  'RETURNS', 'DETERMINISTIC', 'LANGUAGE', 'ANY', 'TYPE', 'CLUSTER', 'OPTIONS', 'SCHEMA', 'MODEL',
  'INSERT', 'INTO', 'VALUES', 'DELETE', 'UPDATE', 'MERGE', 'MATCHED', 'TARGET', 'SOURCE',
  'DECLARE', 'DEFAULT', 'MAX', 'MIN', 'TABLESAMPLE', 'PERCENT',
  'ASSERT', 'EXECUTE', 'IMMEDIATE', 'BEGIN', 'EXCEPTION', 'ELSEIF', 'PRIMARY', 'KEY', 'ENFORCED',
  'IGNORE', 'RESPECT', 'NULLS', 'ROWS', 'UNBOUNDED', 'PRECEDING', 'FOLLOWING', 'CURRENT', 'ROW',
];

const IDENT_PART = choice(
  /[a-zA-Z_][a-zA-Z0-9_]*/, // Standard unquoted
  /`([^`\\]|\\.)*`/,       // Quoted
);

module.exports = grammar({
  name: 'googlesql',

  extras: $ => [/\s/, $.comment],

  word: $ => $._identifier,

  conflicts: $ => [
    [$.query_expression, $.expression],
  ],

  rules: {
    // Statements are separated by ';' (a trailing ';' is optional). Requiring the
    // separator keeps statement-leading keywords (IF, UPDATE, SET, ...) usable as
    // column names after a trailing comma.
    source_file: $ => optional(seq(
      repeat(';'),
      $.statement,
      repeat(seq(repeat1(';'), $.statement)),
      repeat(';')
    )),

    _statement_list: $ => repeat1(seq($.statement, repeat1(';'))),

    statement: $ => choice(
        $.query_expression,
        $.create_table_statement,
        $.create_view_statement,
        $.create_function_statement,
        $.insert_statement,
        $.delete_statement,
        $.update_statement,
        $.merge_statement,
        $.drop_statement,
        $.declare_statement,
        $.set_statement,
        $.create_schema_statement,
        $.assert_statement,
        $.execute_immediate_statement,
        $.call_statement,
        $.begin_block,
        $.if_statement,
    ),

    // --- DDL ---

    _create_or_replace: $ => seq(
      $.keyword_create,
      optional(seq($.keyword_or, $.keyword_replace)),
      optional(choice($.keyword_temp, $.keyword_temporary))
    ),

    _if_not_exists: $ => seq($.keyword_if, $.keyword_not, $.keyword_exists),

    create_table_statement: $ => prec.right(seq(
      $._create_or_replace,
      optional($.keyword_external),
      $.keyword_table,
      optional($._if_not_exists),
      field('name', $.identifier),
      optional($.column_definitions),
      optional($.partition_by_clause),
      optional($.cluster_by_clause),
      optional($.options_clause),
      optional(seq($.keyword_as, $.query_expression))
    )),

    create_view_statement: $ => prec.right(seq(
      $._create_or_replace,
      optional($.keyword_materialized),
      $.keyword_view,
      optional($._if_not_exists),
      field('name', $.identifier),
      optional(seq('(', commaSep1($.identifier), ')')),
      optional($.partition_by_clause),
      optional($.cluster_by_clause),
      optional($.options_clause),
      $.keyword_as,
      $.query_expression
    )),

    create_function_statement: $ => prec.right(seq(
      $._create_or_replace,
      optional($.keyword_table),
      $.keyword_function,
      optional($._if_not_exists),
      field('name', $.identifier),
      '(',
      optional(commaSep1($.function_parameter)),
      ')',
      optional(seq($.keyword_returns, $.data_type)),
      optional(choice(
        seq($.keyword_deterministic),
        seq($.keyword_not, $.keyword_deterministic)
      )),
      optional(seq($.keyword_language, $.identifier)),
      optional($.options_clause),
      optional(seq($.keyword_as, $.expression)) // SQL body in parens, or a JS string body
    )),

    function_parameter: $ => seq(
      field('name', $.identifier),
      choice($.data_type, seq($.keyword_any, $.keyword_type))
    ),

    column_definitions: $ => seq('(', commaSepTrail1(choice($.column_definition, $.table_constraint)), ')'),

    // PRIMARY KEY (a) NOT ENFORCED
    table_constraint: $ => seq(
      $.keyword_primary, $.keyword_key,
      '(', commaSep1($.identifier), ')',
      optional(seq($.keyword_not, $.keyword_enforced))
    ),

    column_definition: $ => seq(
      field('name', $.identifier),
      $.data_type,
      optional(seq($.keyword_not, $.keyword_null)),
      optional($.options_clause)
    ),

    cluster_by_clause: $ => seq($.keyword_cluster, $.keyword_by, commaSep1($.expression)),

    options_clause: $ => seq(
      $.keyword_options,
      '(',
      optional(commaSepTrail1($.option)),
      ')'
    ),

    option: $ => seq(field('name', $.identifier), '=', field('value', $.expression)),

    drop_statement: $ => seq(
      $.keyword_drop,
      optional($.keyword_materialized),
      choice($.keyword_table, $.keyword_view, $.keyword_function, $.keyword_schema),
      optional(seq($.keyword_if, $.keyword_exists)),
      field('name', $.identifier)
    ),

    // --- DML ---

    insert_statement: $ => seq(
      $.keyword_insert,
      optional($.keyword_into),
      field('table', $.identifier),
      optional(seq('(', commaSep1($.identifier), ')')),
      choice($.values_clause, $.query_expression)
    ),

    values_clause: $ => seq($.keyword_values, commaSep1(seq('(', commaSep1($.expression), ')'))),

    delete_statement: $ => seq(
      $.keyword_delete,
      optional($.keyword_from),
      field('table', $.identifier),
      optional(seq(optional($.keyword_as), field('alias', $.identifier))),
      $.where_clause
    ),

    update_statement: $ => seq(
      $.keyword_update,
      field('table', $.identifier),
      optional(seq(optional($.keyword_as), field('alias', $.identifier))),
      $.keyword_set,
      commaSep1($.assignment),
      optional($.from_clause),
      $.where_clause
    ),

    assignment: $ => seq(field('target', $.identifier), '=', field('value', $.expression)),

    merge_statement: $ => seq(
      $.keyword_merge,
      optional($.keyword_into),
      field('target', $.table_expression),
      $.keyword_using,
      field('source', $.table_expression),
      $.keyword_on,
      $.expression,
      repeat1($.merge_when_clause)
    ),

    merge_when_clause: $ => seq(
      $.keyword_when,
      optional($.keyword_not),
      $.keyword_matched,
      optional(seq($.keyword_by, choice($.keyword_target, $.keyword_source))),
      optional(seq($.keyword_and, $.expression)),
      $.keyword_then,
      choice(
        $.keyword_delete,
        seq($.keyword_update, $.keyword_set, commaSep1($.assignment)),
        seq(
          $.keyword_insert,
          optional(seq('(', commaSep1($.identifier), ')')),
          choice($.values_clause, $.keyword_row)
        )
      )
    ),

    // --- Scripting ---

    create_schema_statement: $ => seq(
      $.keyword_create, optional(seq($.keyword_or, $.keyword_replace)),
      $.keyword_schema, optional($._if_not_exists), field('name', $.identifier),
      optional($.options_clause)
    ),

    assert_statement: $ => seq(
      $.keyword_assert, $.expression, optional(seq($.keyword_as, $.string))
    ),

    execute_immediate_statement: $ => seq(
      $.keyword_execute, $.keyword_immediate, $.expression,
      optional(seq($.keyword_into, commaSep1($.identifier))),
      optional(seq($.keyword_using, commaSep1($.alias_expression)))
    ),

    call_statement: $ => seq($.keyword_call, $.function_call),

    begin_block: $ => seq(
      $.keyword_begin,
      optional($._statement_list),
      optional(seq($.keyword_exception, $.keyword_when, $.identifier, $.keyword_then, optional($._statement_list))),
      $.keyword_end
    ),

    if_statement: $ => seq(
      $.keyword_if, $.expression, $.keyword_then, optional($._statement_list),
      repeat(seq($.keyword_elseif, $.expression, $.keyword_then, optional($._statement_list))),
      optional(seq($.keyword_else, optional($._statement_list))),
      $.keyword_end, $.keyword_if
    ),

    declare_statement: $ => seq(
      $.keyword_declare,
      commaSep1($.identifier),
      optional($.data_type),
      optional(seq($.keyword_default, $.expression))
    ),

    set_statement: $ => seq(
      $.keyword_set,
      choice(
        $.identifier,
        $.parameter, // SET @@reservation = 'none'
        seq('(', commaSep1($.identifier), ')')
      ),
      '=',
      $.expression
    ),

    query_expression: $ => seq(
      optional($.with_clause),
      choice($.select_statement, $.from_clause, $.set_operation, $.subquery),
      repeat($.pipe_operation)
    ),

    // SELECT ... UNION ALL SELECT ..., (SELECT ...) EXCEPT DISTINCT (SELECT ...)
    set_operation: $ => prec.left(seq(
      field('left', choice($.select_statement, $.subquery, $.set_operation)),
      $.set_operator,
      field('right', choice($.select_statement, $.subquery))
    )),

    set_operator: $ => seq(
      choice($.keyword_union, $.keyword_intersect, $.keyword_except),
      optional(choice($.keyword_all, $.keyword_distinct))
    ),

    with_clause: $ => seq(
      $.keyword_with,
      optional($.keyword_recursive),
      commaSepTrail1($.cte_definition)
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
      optional(choice($.keyword_distinct, $.keyword_all)),
      optional($.select_as),
      commaSepTrail1($._select_item),
      optional($.from_clause),
      optional($.where_clause),
      optional($.group_by_clause),
      optional($.having_clause),
      optional($.qualify_clause),
      optional($.window_clause),
      optional($.order_by_clause),
      optional($.limit_clause)
    )),

    // SELECT AS STRUCT / SELECT AS VALUE
    select_as: $ => seq($.keyword_as, choice($.keyword_struct, $.keyword_value)),

    _select_item: $ => choice($.alias_expression, $.select_star),

    // *, t.*, * EXCEPT (a, b), * REPLACE (x + 1 AS x)
    select_star: $ => prec.right(seq(
      optional(seq(field('qualifier', $.expression), '.')),
      $.star,
      optional($.star_except),
      optional($.star_replace)
    )),

    star_except: $ => seq($.keyword_except, '(', commaSepTrail1($.identifier), ')'),
    star_replace: $ => seq($.keyword_replace, '(', commaSepTrail1($.alias_expression), ')'),

    qualify_clause: $ => seq($.keyword_qualify, $.expression),

    window_clause: $ => seq($.keyword_window, commaSep1($.window_definition)),
    window_definition: $ => seq(
      field('name', $.identifier),
      $.keyword_as,
      '(', optional($._window_specification), ')'
    ),

    from_clause: $ => prec.right(seq(
      $.keyword_from,
      $.table_expression,
      repeat(choice(
        seq(',', $.table_expression),
        $.join_clause
      ))
    )),

    join_clause: $ => seq(
      optional(choice(
        $.keyword_inner,
        seq(choice($.keyword_left, $.keyword_right, $.keyword_full), optional($.keyword_outer)),
        $.keyword_cross
      )),
      $.keyword_join,
      $.table_expression,
      optional($.join_condition)
    ),
    where_clause: $ => seq($.keyword_where, $.expression),
    group_by_clause: $ => seq($.keyword_group, $.keyword_by, choice($.keyword_all, commaSep1($.expression))),
    order_by_clause: $ => seq($.keyword_order, $.keyword_by, commaSep1($.order_expression)),
    pipe_group_by_clause: $ => prec.right(seq(
      $.keyword_group,
      $.keyword_by,
      commaSepTrail1($.expression)
    )),
    limit_clause: $ => seq(
      $.keyword_limit, choice($.number, $.parameter),
      optional(seq($.keyword_offset, choice($.number, $.parameter)))
    ),
    having_clause: $ => seq($.keyword_having, $.expression),

    pivot_clause: $ => seq(
      $.keyword_pivot,
      '(',
      commaSepTrail1($.alias_expression), // Aggregations: SUM(x) AS alias
      $.keyword_for,
      $.identifier,                       // The pivot column
      $.keyword_in,
      '(',
      commaSepTrail1($.pivot_value),      // Values: 'a', 'b' AS alias
      ')',
      ')'
    ),

    // Values inside IN (...) can be expressions with optional aliases
    pivot_value: $ => seq(
      $.expression,
      optional(seq($.keyword_as, $.identifier))
    ),
    // --- Pipe Operations ---

    pipe_operation: $ => seq(
      '|>',
      choice(
        $.pipe_select, $.pipe_extend, $.pipe_set, $.pipe_drop,
        $.pipe_rename, $.pipe_where, $.pipe_aggregate, $.pipe_join,
        $.pipe_limit, $.pipe_order_by, $.pipe_window, $.pipe_call,
        $.pipe_pivot
      )
    ),

    pipe_select: $ => prec.right(seq($.keyword_select, optional($.keyword_distinct), commaSepTrail1($._select_item))),
    pipe_extend: $ => prec.right(seq($.keyword_extend, commaSepTrail1($.alias_expression))),
    pipe_set: $ => prec.right(seq($.keyword_set, commaSepTrail1($.alias_expression))),
    pipe_drop: $ => prec.right(seq($.keyword_drop, commaSepTrail1($.identifier))),
    pipe_rename: $ => prec.right(seq($.keyword_rename, commaSepTrail1(seq($.identifier, $.keyword_as, $.identifier)))),
    pipe_aggregate: $ => prec.right(seq(
      $.keyword_aggregate,
      commaSepTrail1($.alias_expression),
      optional($.pipe_group_by_clause)
    )),
    pipe_where: $ => seq($.keyword_where, $.expression),
    pipe_pivot: $ => $.pivot_clause,

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

    is_expression: $ => prec.left(PREC.compare, seq(
      $.expression,
      $.keyword_is,
      optional($.keyword_not),
      choice(
        $.keyword_null,
        $.boolean,
        seq($.keyword_distinct, $.keyword_from, $.expression) // IS [NOT] DISTINCT FROM
      )
    )),

    table_expression: $ => prec.right(seq(
      choice($.identifier, $.function_call, $.subquery, $.unnest_expression, $.parenthesized_join),
      optional(seq($.keyword_for, $.keyword_system_time, $.keyword_as, $.keyword_of, $.expression)),
      optional($.tablesample_clause),
      optional(choice($.pivot_clause, $.unpivot_clause)),
      optional(seq(optional($.keyword_as), field('alias', $.identifier))),
      optional(choice($.pivot_clause, $.unpivot_clause)),
      optional(seq(
        $.keyword_with, $.keyword_offset,
        optional(seq(optional($.keyword_as), field('offset_alias', $.identifier)))
      ))
    )),

    // FROM (a CROSS JOIN b) LEFT JOIN c ...
    parenthesized_join: $ => seq(
      '(',
      $.table_expression,
      repeat1(choice(seq(',', $.table_expression), $.join_clause)),
      ')'
    ),

    // TABLESAMPLE SYSTEM (10 PERCENT)
    tablesample_clause: $ => seq(
      $.keyword_tablesample, $.identifier, '(', $.expression, $.keyword_percent, ')'
    ),

    unnest_expression: $ => seq($.keyword_unnest, '(', $.expression, ')'),

    unpivot_clause: $ => seq(
      $.keyword_unpivot,
      optional(seq(choice($.keyword_include, $.keyword_exclude), $.keyword_nulls)),
      '(',
      choice($.identifier, seq('(', commaSep1($.identifier), ')')),
      $.keyword_for,
      $.identifier,
      $.keyword_in,
      '(',
      commaSepTrail1(seq(
        choice($.identifier, seq('(', commaSep1($.identifier), ')')),
        optional(seq(optional($.keyword_as), choice($.string, $.number, $.identifier)))
      )),
      ')',
      ')'
    ),

    join_condition: $ => choice(
      seq($.keyword_on, $.expression),
      seq($.keyword_using, '(', commaSep1($.identifier), ')')
    ),

    alias_expression: $ => prec.right(seq(
      $.expression,
      optional(seq(optional($.keyword_as), field('alias', $.identifier)))
    )),

    order_expression: $ => seq(
      $.expression,
      optional(choice($.keyword_asc, $.keyword_desc)),
      optional(seq($.keyword_nulls, choice($.keyword_first, $.keyword_last)))
    ),

    expression: $ => choice(
      $.identifier, $.number, $.string, $.boolean, $.keyword_null, $.parameter,
      $.function_call,
      $.cast_expression,
      $.extract_expression,
      $.interval_expression,
      $.typed_literal,
      $.array_expression,
      $.struct_expression,
      $.tuple_expression,
      $.exists_expression,
      $.subscript_expression,
      $.field_access,
      $.unary_expression, $.binary_expression, $.is_expression,
      $.between_expression,
      $.in_expression,
      $.like_expression,
      $.case_expression,
      $.parenthesized_expression,
      $.subquery
    ),

    subquery: $ => seq(
      '(',
      $.query_expression,
      ')'
    ),

    function_call: $ => seq(
      field('name', $.function_name),
      '(',
      optional(choice(
        $.star, // COUNT(*)
        seq(
          optional($.keyword_distinct),
          commaSep1(choice($.expression, $.named_argument, $.table_argument)),
          optional($.null_handling),
          optional(seq($.keyword_having, choice($.keyword_max, $.keyword_min), $.expression)),
          optional($.order_by_clause),
          optional($.limit_clause)
        )
      )),
      ')',
      optional($.over_clause)
    ),

    // ML.PREDICT(MODEL m, TABLE t)
    table_argument: $ => seq(choice($.keyword_model, $.keyword_table), $.identifier),

    named_argument: $ => seq(field('name', $.identifier), '=>', field('value', $.expression)),

    // IGNORE NULLS / RESPECT NULLS inside aggregate and navigation functions
    null_handling: $ => seq(choice($.keyword_ignore, $.keyword_respect), $.keyword_nulls),

    over_clause: $ => seq(
      $.keyword_over,
      choice(
        $.identifier, // named window
        seq('(', optional($._window_specification), ')')
      )
    ),

    _window_specification: $ => choice(
      seq(
        $.identifier,
        optional($.partition_by_clause),
        optional($.order_by_clause),
        optional($.window_frame)
      ),
      seq($.partition_by_clause, optional($.order_by_clause), optional($.window_frame)),
      seq($.order_by_clause, optional($.window_frame)),
      $.window_frame,
    ),

    partition_by_clause: $ => seq($.keyword_partition, $.keyword_by, commaSep1($.expression)),

    window_frame: $ => seq(
      choice($.keyword_rows, $.keyword_range),
      choice(
        seq($.keyword_between, $.frame_bound, $.keyword_and, $.frame_bound),
        $.frame_bound
      )
    ),

    frame_bound: $ => choice(
      seq($.keyword_unbounded, choice($.keyword_preceding, $.keyword_following)),
      seq($.keyword_current, $.keyword_row),
      seq($.expression, choice($.keyword_preceding, $.keyword_following))
    ),

    // CAST(x AS STRING), SAFE_CAST(x AS ARRAY<INT64>), CAST(x AS STRING FORMAT 'YYYY')
    cast_expression: $ => seq(
      choice($.keyword_cast, $.keyword_safe_cast),
      '(',
      field('value', $.expression),
      $.keyword_as,
      field('type', $.data_type),
      optional(seq($.keyword_format, $.expression)),
      ')'
    ),

    // EXTRACT(DAY FROM ts), EXTRACT(WEEK(MONDAY) FROM d)
    extract_expression: $ => seq(
      $.keyword_extract,
      '(',
      field('part', choice($.identifier, $.function_call)),
      $.keyword_from,
      $.expression,
      optional(seq($.keyword_at, $.identifier, $.identifier, $.expression)), // AT TIME ZONE
      ')'
    ),

    // INTERVAL 1 DAY, INTERVAL '1-2' YEAR TO MONTH
    interval_expression: $ => prec.right(seq(
      $.keyword_interval,
      $.expression,
      field('part', $.identifier),
      optional(seq($.keyword_to, field('to_part', $.identifier)))
    )),

    // DATE '2024-01-01', TIMESTAMP "2024-01-01 00:00:00", JSON '{}'
    typed_literal: $ => seq(
      choice(
        $.keyword_date, $.keyword_datetime, $.keyword_time, $.keyword_timestamp,
        $.keyword_numeric, $.keyword_bignumeric, $.keyword_json
      ),
      $.string
    ),

    // [1, 2], ARRAY<INT64>[1], ARRAY(SELECT ...)
    array_expression: $ => choice(
      seq(
        optional(seq($.keyword_array, optional(seq('<', $.data_type, '>')))),
        '[',
        optional(commaSep1($.expression)),
        ']'
      ),
      seq($.keyword_array, $.subquery)
    ),

    // STRUCT(1 AS a, 'x' AS b), STRUCT<a INT64>(1)
    struct_expression: $ => seq(
      $.keyword_struct,
      optional(seq('<', commaSep1($.struct_field_type), '>')),
      '(',
      optional(commaSep1($.alias_expression)),
      ')'
    ),

    // (a, b) tuple / anonymous struct
    tuple_expression: $ => seq('(', $.expression, repeat1(seq(',', $.expression)), ')'),

    exists_expression: $ => seq($.keyword_exists, $.subquery),

    // arr[OFFSET(0)], arr[SAFE_OFFSET(0)], json['key']
    subscript_expression: $ => prec(PREC.postfix, seq(
      field('value', $.expression),
      '[',
      field('index', $.expression),
      ']'
    )),

    // f(x).field, arr[OFFSET(0)].field, (expr).field
    field_access: $ => prec(PREC.postfix, seq(
      field('value', $.expression),
      '.',
      field('field', $.identifier)
    )),

    data_type: $ => choice(
      seq($.keyword_array, '<', $.data_type, '>'),
      seq($.keyword_struct, '<', commaSep1($.struct_field_type), '>'),
      seq($.keyword_range, '<', $.data_type, '>'),
      prec.right(seq(
        field('name', $.identifier),
        optional(seq('(', commaSep1($.number), ')'))
      )),
    ),

    struct_field_type: $ => choice(
      prec(1, seq(field('name', $.identifier), $.data_type)),
      $.data_type
    ),

    unary_expression: $ => choice(
      prec(PREC.unary, seq(field('operator', choice('-', '+', '~')), field('operand', $.expression))),
      prec(PREC.not, seq(field('operator', $.keyword_not), field('operand', $.expression))),
    ),

    binary_expression: $ => choice(
      ...[
        [PREC.mult, choice('*', '/', '%', '||')],
        [PREC.add, choice('+', '-')],
        [PREC.shift, choice('<<', '>>')],
        [PREC.bitand, '&'],
        [PREC.bitxor, '^'],
        [PREC.bitor, '|'],
        [PREC.compare, choice('=', '<', '>', '<=', '>=', '<>', '!=')],
        [PREC.and, $.keyword_and],
        [PREC.or, $.keyword_or],
      ].map(([p, op]) => prec.left(p, seq(
        field('left', $.expression),
        field('operator', op),
        field('right', $.expression)
      )))
    ),

    // x [NOT] BETWEEN y AND z
    between_expression: $ => prec.left(PREC.compare, seq(
      $.expression,
      optional($.keyword_not),
      $.keyword_between,
      $.expression, // Lower bound
      $.keyword_and,
      $.expression  // Upper bound
    )),

    // x [NOT] IN (a, b, c)  OR  x [NOT] IN (SELECT ...)
    in_expression: $ => prec.left(PREC.compare, seq(
      $.expression,
      optional($.keyword_not),
      $.keyword_in,
      choice(
        seq('(', commaSep1($.expression), ')'),
        seq('(', $.query_expression, ')'), // subquery
        $.unnest_expression
      )
    )),

    // x [NOT] LIKE y
    like_expression: $ => prec.left(PREC.compare, seq(
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
    function_name: $ => choice(prec(1, $.identifier), alias($.keyword_if, $.identifier)),

    // Keywords that are commonly also used as column / function names
    identifier: $ => choice(
      $._identifier,
      ...UNRESERVED.map(k => alias($['keyword_' + k.toLowerCase()], k.toLowerCase()))
    ),

    // A (possibly dotted) path: a.b.c, `proj.ds.tbl`, `proj`.`ds`.`tbl`, a.`b-c`
    _identifier: $ => token(prec(-1, seq(
      IDENT_PART,
      repeat(seq('.', IDENT_PART))
    ))),

    // Query parameters (@param) and system variables (@@var)
    parameter: $ => token(seq(/@@?/, /[a-zA-Z_][a-zA-Z0-9_.]*/)),

    number: $ => token(choice(/0[xX][0-9a-fA-F]+/, seq(
      choice(
        seq(/\d+/, optional(seq('.', optional(/\d+/)))), // Matches: 123, 123., 123.45
        seq('.', /\d+/)                                  // Matches: .45
      ),
      optional(seq(/[eE]/, optional(/[+-]/), /\d+/))     // Matches: e6, E-5, e+10
    ))),
    // '...', "...", '''...''', """...""" with optional r/b/rb/br prefix
    string: $ => token(seq(
      optional(/[rR][bB]?|[bB][rR]?/),
      choice(
        /'''([^'\\]|\\(.|\n)|'[^']|''[^'])*'''/,
        /"""([^"\\]|\\(.|\n)|"[^"]|""[^"])*"""/,
        /'([^'\\\n]|\\.)*'/,
        /"([^"\\\n]|\\.)*"/,
      )
    )),
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
    keyword_having: $ => token(caseInsensitive('HAVING')),
    keyword_pivot: $ => token(caseInsensitive('PIVOT')),
    keyword_for:   $ => token(caseInsensitive('FOR')),
    ...Object.fromEntries(NEW_KEYWORDS.map(k => [
      'keyword_' + k.toLowerCase(), _ => token(caseInsensitive(k))
    ])),
  }
});

// Strict: No trailing comma allowed (e.g., Standard SQL GROUP BY)
function commaSep1(rule) {
  return seq(rule, repeat(seq(',', rule)));
}

// Trailing: Optional trailing comma allowed (e.g., Pipe syntax SELECT, EXTEND)
function commaSepTrail1(rule) {
  return prec.right(seq(
    rule,
    repeat(seq(',', rule)),
    optional(',')
  ));
}

function caseInsensitive(keyword) {
  return new RegExp(keyword.split('').map(l => `[${l.toLowerCase()}${l.toUpperCase()}]`).join(''));
}
