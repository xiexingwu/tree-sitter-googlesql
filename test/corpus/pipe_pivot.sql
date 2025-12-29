==================
PIVOT Clause
==================
FROM Sales
|> PIVOT(SUM(amount) FOR quarter IN ('Q1', 'Q2'))
|> SELECT *

---

(source_file
  (statement
    (query_expression
      (from_clause
        (keyword_from)
        (table_expression (identifier)))
      (pipe_operation
        (pipe_pivot
          (pivot_clause
            (keyword_pivot)
            (alias_expression (expression (function_call (function_name (identifier)) (expression (identifier)))))
            (keyword_for)
            (identifier)
            (keyword_in)
            (pivot_value (expression (string)))
            (pivot_value (expression (string))))))
      (pipe_operation
        (pipe_select
          (keyword_select)
          (alias_expression (expression (star))))))))

==================
Standard SQL PIVOT
==================
FROM DailySales PIVOT(SUM(x) AS sum_x FOR day IN (1 AS mon, 2 AS tue)) AS p

---

(source_file
  (statement
    (query_expression
      (from_clause
        (keyword_from)
        (table_expression
          (identifier)
          (pivot_clause
            (keyword_pivot)
            (alias_expression
              (expression (function_call (function_name (identifier)) (expression (identifier))))
              (keyword_as)
              (identifier))
            (keyword_for)
            (identifier)
            (keyword_in)
            (pivot_value
              (expression (number))
              (keyword_as)
              (identifier))
            (pivot_value
              (expression (number))
              (keyword_as)
              (identifier)))
          (keyword_as)
          (identifier))))))
