==================
CREATE OR REPLACE TABLE ... AS
==================
create or replace table `proj`.`ds`.`tbl`
  partition by date
  cluster by a, b
  OPTIONS(
    description="""""",
    expiration_timestamp=TIMESTAMP_ADD(CURRENT_TIMESTAMP(), INTERVAL 12 hour)
  )
as (
  SELECT 1 AS a
);

---

(source_file
  (statement
    (create_table_statement
      (keyword_create)
      (keyword_or)
      (keyword_replace)
      (keyword_table)
      (identifier)
      (partition_by_clause
        (keyword_partition)
        (keyword_by)
        (expression
          (identifier)))
      (cluster_by_clause
        (keyword_cluster)
        (keyword_by)
        (expression
          (identifier))
        (expression
          (identifier)))
      (options_clause
        (keyword_options)
        (option
          (identifier)
          (expression
            (string)))
        (option
          (identifier)
          (expression
            (function_call
              (function_name
                (identifier))
              (expression
                (function_call
                  (function_name
                    (identifier))))
              (expression
                (interval_expression
                  (keyword_interval)
                  (expression
                    (number))
                  (identifier)))))))
      (keyword_as)
      (query_expression
        (subquery
          (query_expression
            (select_statement
              (keyword_select)
              (alias_expression
                (expression
                  (number))
                (keyword_as)
                (identifier)))))))))

==================
CREATE VIEW and CREATE FUNCTION
==================
create or replace view `proj`.`ds`.`v`
  OPTIONS(description="""x""")
as SELECT * FROM t;

CREATE TEMP FUNCTION f(x STRING, y ARRAY<INT64>)
RETURNS STRING
AS ((SELECT x));

CREATE FUNCTION g(x ANY TYPE) RETURNS FLOAT64 LANGUAGE js AS r"""return 1;""";

---

(source_file
  (statement
    (create_view_statement
      (keyword_create)
      (keyword_or)
      (keyword_replace)
      (keyword_view)
      (identifier)
      (options_clause
        (keyword_options)
        (option
          (identifier)
          (expression
            (string))))
      (keyword_as)
      (query_expression
        (select_statement
          (keyword_select)
          (select_star
            (star))
          (from_clause
            (keyword_from)
            (table_expression
              (identifier)))))))
  (statement
    (create_function_statement
      (keyword_create)
      (keyword_temp)
      (keyword_function)
      (identifier)
      (function_parameter
        (identifier)
        (data_type
          (identifier)))
      (function_parameter
        (identifier)
        (data_type
          (keyword_array)
          (data_type
            (identifier))))
      (keyword_returns)
      (data_type
        (identifier))
      (keyword_as)
      (expression
        (parenthesized_expression
          (expression
            (subquery
              (query_expression
                (select_statement
                  (keyword_select)
                  (alias_expression
                    (expression
                      (identifier)))))))))))
  (statement
    (create_function_statement
      (keyword_create)
      (keyword_function)
      (identifier)
      (function_parameter
        (identifier)
        (keyword_any)
        (keyword_type))
      (keyword_returns)
      (data_type
        (identifier))
      (keyword_language)
      (identifier)
      (keyword_as)
      (expression
        (string)))))

==================
DECLARE, SET and MERGE
==================
declare parts array<date>;
set (parts) = (select as struct array_agg(distinct date(d) IGNORE NULLS) from t);
merge into `ds`.`t` as DEST
  using (select * from src) as SRC
  on FALSE
when not matched by source and date(DEST.d) in unnest(parts) then delete
when matched then update set a = SRC.a
when not matched then insert (`a`, `b`) values (`a`, `b`);
drop table if exists `ds`.`tmp`

---

(source_file
  (statement
    (declare_statement
      (keyword_declare)
      (identifier)
      (data_type
        (keyword_array)
        (data_type
          (identifier)))))
  (statement
    (set_statement
      (keyword_set)
      (identifier)
      (expression
        (subquery
          (query_expression
            (select_statement
              (keyword_select)
              (select_as
                (keyword_as)
                (keyword_struct))
              (alias_expression
                (expression
                  (function_call
                    (function_name
                      (identifier))
                    (keyword_distinct)
                    (expression
                      (function_call
                        (function_name
                          (identifier))
                        (expression
                          (identifier))))
                    (null_handling
                      (keyword_ignore)
                      (keyword_nulls)))))
              (from_clause
                (keyword_from)
                (table_expression
                  (identifier)))))))))
  (statement
    (merge_statement
      (keyword_merge)
      (keyword_into)
      (table_expression
        (identifier)
        (keyword_as)
        (identifier))
      (keyword_using)
      (table_expression
        (subquery
          (query_expression
            (select_statement
              (keyword_select)
              (select_star
                (star))
              (from_clause
                (keyword_from)
                (table_expression
                  (identifier))))))
        (keyword_as)
        (identifier))
      (keyword_on)
      (expression
        (boolean
          (keyword_false)))
      (merge_when_clause
        (keyword_when)
        (keyword_not)
        (keyword_matched)
        (keyword_by)
        (keyword_source)
        (keyword_and)
        (expression
          (in_expression
            (expression
              (function_call
                (function_name
                  (identifier))
                (expression
                  (identifier))))
            (keyword_in)
            (unnest_expression
              (keyword_unnest)
              (expression
                (identifier)))))
        (keyword_then)
        (keyword_delete))
      (merge_when_clause
        (keyword_when)
        (keyword_matched)
        (keyword_then)
        (keyword_update)
        (keyword_set)
        (assignment
          (identifier)
          (expression
            (identifier))))
      (merge_when_clause
        (keyword_when)
        (keyword_not)
        (keyword_matched)
        (keyword_then)
        (keyword_insert)
        (identifier)
        (identifier)
        (values_clause
          (keyword_values)
          (expression
            (identifier))
          (expression
            (identifier))))))
  (statement
    (drop_statement
      (keyword_drop)
      (keyword_table)
      (keyword_if)
      (keyword_exists)
      (identifier))))

==================
INSERT, UPDATE and DELETE
==================
INSERT INTO t (a, b) VALUES (1, 2), (3, 4);
INSERT t SELECT * FROM s;
UPDATE t SET a = 1, b = b + 1 WHERE TRUE;
DELETE FROM t WHERE a IS NULL;

---

(source_file
  (statement
    (insert_statement
      (keyword_insert)
      (keyword_into)
      (identifier)
      (identifier)
      (identifier)
      (values_clause
        (keyword_values)
        (expression
          (number))
        (expression
          (number))
        (expression
          (number))
        (expression
          (number)))))
  (statement
    (insert_statement
      (keyword_insert)
      (identifier)
      (query_expression
        (select_statement
          (keyword_select)
          (select_star
            (star))
          (from_clause
            (keyword_from)
            (table_expression
              (identifier)))))))
  (statement
    (update_statement
      (keyword_update)
      (identifier)
      (keyword_set)
      (assignment
        (identifier)
        (expression
          (number)))
      (assignment
        (identifier)
        (expression
          (binary_expression
            (expression
              (identifier))
            (expression
              (number)))))
      (where_clause
        (keyword_where)
        (expression
          (boolean
            (keyword_true))))))
  (statement
    (delete_statement
      (keyword_delete)
      (keyword_from)
      (identifier)
      (where_clause
        (keyword_where)
        (expression
          (is_expression
            (expression
              (identifier))
            (keyword_is)
            (keyword_null)))))))

==================
Table-valued function arguments
==================
SELECT * FROM ML.PREDICT(MODEL `ds`.`m`, (SELECT * FROM eval_data))

---

(source_file
  (statement
    (query_expression
      (select_statement
        (keyword_select)
        (select_star
          (star))
        (from_clause
          (keyword_from)
          (table_expression
            (function_call
              (function_name
                (identifier))
              (table_argument
                (keyword_model)
                (identifier))
              (expression
                (subquery
                  (query_expression
                    (select_statement
                      (keyword_select)
                      (select_star
                        (star))
                      (from_clause
                        (keyword_from)
                        (table_expression
                          (identifier))))))))))))))

==================
Trailing CTE comma, system variables and table constraints
==================
SET @@reservation = 'none';
CREATE TABLE t (
  id STRING NOT NULL,
  langs ARRAY<STRUCT<language STRING, q_score FLOAT64>>,
  PRIMARY KEY (id) NOT ENFORCED
);
WITH a AS (SELECT 1 AS x),
SELECT * FROM (a CROSS JOIN b AS c) LEFT JOIN d ON c.x = d.x

---

(source_file
  (statement
    (set_statement
      (keyword_set)
      (parameter)
      (expression
        (string))))
  (statement
    (create_table_statement
      (keyword_create)
      (keyword_table)
      (identifier)
      (column_definitions
        (column_definition
          (identifier)
          (data_type
            (identifier))
          (keyword_not)
          (keyword_null))
        (column_definition
          (identifier)
          (data_type
            (keyword_array)
            (data_type
              (keyword_struct)
              (struct_field_type
                (identifier)
                (data_type
                  (identifier)))
              (struct_field_type
                (identifier)
                (data_type
                  (identifier))))))
        (table_constraint
          (keyword_primary)
          (keyword_key)
          (identifier)
          (keyword_not)
          (keyword_enforced)))))
  (statement
    (query_expression
      (with_clause
        (keyword_with)
        (cte_definition
          (identifier)
          (keyword_as)
          (query_expression
            (select_statement
              (keyword_select)
              (alias_expression
                (expression
                  (number))
                (keyword_as)
                (identifier))))))
      (select_statement
        (keyword_select)
        (select_star
          (star))
        (from_clause
          (keyword_from)
          (table_expression
            (parenthesized_join
              (table_expression
                (identifier))
              (join_clause
                (keyword_cross)
                (keyword_join)
                (table_expression
                  (identifier)
                  (keyword_as)
                  (identifier)))))
          (join_clause
            (keyword_left)
            (keyword_join)
            (table_expression
              (identifier))
            (join_condition
              (keyword_on)
              (expression
                (binary_expression
                  (expression
                    (identifier))
                  (expression
                    (identifier)))))))))))
