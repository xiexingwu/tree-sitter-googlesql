; queries/googlesql/highlights.scm

; Generic identifiers first so that the more specific captures below win.
(identifier) @variable

[
  (keyword_aggregate)
  (keyword_all)
  (keyword_and)
  (keyword_any)
  (keyword_array)
  (keyword_as)
  (keyword_asc)
  (keyword_assert)
  (keyword_at)
  (keyword_begin)
  (keyword_between)
  (keyword_bignumeric)
  (keyword_by)
  (keyword_call)
  (keyword_case)
  (keyword_cast)
  (keyword_cluster)
  (keyword_create)
  (keyword_cross)
  (keyword_current)
  (keyword_date)
  (keyword_datetime)
  (keyword_declare)
  (keyword_default)
  (keyword_delete)
  (keyword_desc)
  (keyword_deterministic)
  (keyword_distinct)
  (keyword_drop)
  (keyword_else)
  (keyword_elseif)
  (keyword_end)
  (keyword_enforced)
  (keyword_except)
  (keyword_exception)
  (keyword_exclude)
  (keyword_execute)
  (keyword_exists)
  (keyword_extend)
  (keyword_external)
  (keyword_extract)
  (keyword_first)
  (keyword_following)
  (keyword_for)
  (keyword_format)
  (keyword_from)
  (keyword_full)
  (keyword_function)
  (keyword_group)
  (keyword_having)
  (keyword_if)
  (keyword_ignore)
  (keyword_immediate)
  (keyword_in)
  (keyword_include)
  (keyword_inner)
  (keyword_insert)
  (keyword_intersect)
  (keyword_interval)
  (keyword_into)
  (keyword_is)
  (keyword_join)
  (keyword_json)
  (keyword_key)
  (keyword_language)
  (keyword_last)
  (keyword_left)
  (keyword_like)
  (keyword_limit)
  (keyword_matched)
  (keyword_materialized)
  (keyword_max)
  (keyword_merge)
  (keyword_min)
  (keyword_model)
  (keyword_not)
  (keyword_nulls)
  (keyword_numeric)
  (keyword_of)
  (keyword_offset)
  (keyword_on)
  (keyword_options)
  (keyword_or)
  (keyword_order)
  (keyword_outer)
  (keyword_over)
  (keyword_partition)
  (keyword_percent)
  (keyword_pivot)
  (keyword_preceding)
  (keyword_primary)
  (keyword_qualify)
  (keyword_range)
  (keyword_recursive)
  (keyword_rename)
  (keyword_replace)
  (keyword_respect)
  (keyword_returns)
  (keyword_right)
  (keyword_row)
  (keyword_rows)
  (keyword_safe_cast)
  (keyword_schema)
  (keyword_select)
  (keyword_set)
  (keyword_source)
  (keyword_struct)
  (keyword_system_time)
  (keyword_table)
  (keyword_tablesample)
  (keyword_target)
  (keyword_temp)
  (keyword_temporary)
  (keyword_then)
  (keyword_time)
  (keyword_timestamp)
  (keyword_to)
  (keyword_type)
  (keyword_unbounded)
  (keyword_union)
  (keyword_unnest)
  (keyword_unpivot)
  (keyword_update)
  (keyword_using)
  (keyword_value)
  (keyword_values)
  (keyword_view)
  (keyword_when)
  (keyword_where)
  (keyword_window)
  (keyword_with)
] @keyword

(keyword_null) @constant.builtin
(keyword_true) @boolean
(keyword_false) @boolean

[
  "|>"
  "="
  "!="
  "<>"
  "<"
  ">"
  "<="
  ">="
  "+"
  "-"
  "*"
  "/"
  "%"
  "||"
  "&"
  "|"
  "^"
  "~"
  "<<"
  ">>"
  "=>"
] @operator

["(" ")" "[" "]"] @punctuation.bracket
["," "." ";"] @punctuation.delimiter

(string) @string
(number) @number
(comment) @comment @spell
(parameter) @variable.parameter

(function_name (identifier) @function.call)
(data_type name: (identifier) @type.builtin)
(data_type [(keyword_array) (keyword_struct) (keyword_range)] @type.builtin)
(typed_literal [(keyword_date) (keyword_datetime) (keyword_time) (keyword_timestamp) (keyword_numeric) (keyword_bignumeric) (keyword_json)] @type.builtin)
(cte_definition (identifier) @type)
(star) @character.special

(field_access field: (identifier) @variable.member)
(named_argument name: (identifier) @variable.parameter)
(function_parameter name: (identifier) @variable.parameter)
(option name: (identifier) @property)
