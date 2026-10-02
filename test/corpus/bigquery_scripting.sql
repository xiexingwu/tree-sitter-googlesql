==================
IF, BEGIN, ASSERT, EXECUTE IMMEDIATE and CALL
==================
IF (SELECT COUNT(*) FROM t) > 0 THEN
  SELECT 1;
ELSEIF x THEN
  SELECT 2;
ELSE
  SELECT 3;
END IF;
BEGIN
  SELECT 1;
EXCEPTION WHEN ERROR THEN
  SELECT @@error.message;
END;
ASSERT (SELECT COUNT(*) FROM t) > 0 AS 'non-empty';
EXECUTE IMMEDIATE 'SELECT 1';
CALL ds.proc(1);
CREATE SCHEMA IF NOT EXISTS ds

---

(source_file
  (statement
    (if_statement
      (keyword_if)
      (expression
        (binary_expression
          (expression
            (subquery
              (query_expression
                (select_statement
                  (keyword_select)
                  (alias_expression
                    (expression
                      (function_call
                        (function_name
                          (identifier))
                        (star))))
                  (from_clause
                    (keyword_from)
                    (table_expression
                      (identifier)))))))
          (expression
            (number))))
      (keyword_then)
      (statement
        (query_expression
          (select_statement
            (keyword_select)
            (alias_expression
              (expression
                (number))))))
      (keyword_elseif)
      (expression
        (identifier))
      (keyword_then)
      (statement
        (query_expression
          (select_statement
            (keyword_select)
            (alias_expression
              (expression
                (number))))))
      (keyword_else)
      (statement
        (query_expression
          (select_statement
            (keyword_select)
            (alias_expression
              (expression
                (number))))))
      (keyword_end)
      (keyword_if)))
  (statement
    (begin_block
      (keyword_begin)
      (statement
        (query_expression
          (select_statement
            (keyword_select)
            (alias_expression
              (expression
                (number))))))
      (keyword_exception)
      (keyword_when)
      (identifier)
      (keyword_then)
      (statement
        (query_expression
          (select_statement
            (keyword_select)
            (alias_expression
              (expression
                (parameter))))))
      (keyword_end)))
  (statement
    (assert_statement
      (keyword_assert)
      (expression
        (binary_expression
          (expression
            (subquery
              (query_expression
                (select_statement
                  (keyword_select)
                  (alias_expression
                    (expression
                      (function_call
                        (function_name
                          (identifier))
                        (star))))
                  (from_clause
                    (keyword_from)
                    (table_expression
                      (identifier)))))))
          (expression
            (number))))
      (keyword_as)
      (string)))
  (statement
    (execute_immediate_statement
      (keyword_execute)
      (keyword_immediate)
      (expression
        (string))))
  (statement
    (call_statement
      (keyword_call)
      (function_call
        (function_name
          (identifier))
        (expression
          (number)))))
  (statement
    (create_schema_statement
      (keyword_create)
      (keyword_schema)
      (keyword_if)
      (keyword_not)
      (keyword_exists)
      (identifier))))

==================
Trailing comma before a statement keyword used as a column
==================
SELECT a, update, FROM t;
SELECT IF(x, 1, 2) AS y,

---

(source_file
  (statement
    (query_expression
      (select_statement
        (keyword_select)
        (alias_expression
          (expression
            (identifier)))
        (alias_expression
          (expression
            (identifier)))
        (from_clause
          (keyword_from)
          (table_expression
            (identifier))))))
  (statement
    (query_expression
      (select_statement
        (keyword_select)
        (alias_expression
          (expression
            (function_call
              (function_name
                (identifier))
              (expression
                (identifier))
              (expression
                (number))
              (expression
                (number))))
          (keyword_as)
          (identifier))))))

==================
Misc expressions
==================
SELECT
  x IS NOT DISTINCT FROM y,
  ANY_VALUE(x HAVING MAX y),
  a << 2,
  0x1F
FROM t TABLESAMPLE SYSTEM (10 PERCENT)

---

(source_file
  (statement
    (query_expression
      (select_statement
        (keyword_select)
        (alias_expression
          (expression
            (is_expression
              (expression
                (identifier))
              (keyword_is)
              (keyword_not)
              (keyword_distinct)
              (keyword_from)
              (expression
                (identifier)))))
        (alias_expression
          (expression
            (function_call
              (function_name
                (identifier))
              (expression
                (identifier))
              (keyword_having)
              (keyword_max)
              (expression
                (identifier)))))
        (alias_expression
          (expression
            (binary_expression
              (expression
                (identifier))
              (expression
                (number)))))
        (alias_expression
          (expression
            (number)))
        (from_clause
          (keyword_from)
          (table_expression
            (identifier)
            (tablesample_clause
              (keyword_tablesample)
              (identifier)
              (expression
                (number))
              (keyword_percent))))))))
