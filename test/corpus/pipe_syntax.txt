==================
Basic From Pipe
==================
FROM table_name
|> WHERE column > 100
|> SELECT column, other_column

---

(source_file
  (statement
    (query_expression
      (from_clause
        (table_expression (identifier)))
      (pipe_operation
        (pipe_where
          (expression
            (binary_expression
              (expression (identifier))
              (expression (number))))))
      (pipe_operation
        (pipe_select
          (alias_expression (expression (identifier)))
          (alias_expression (expression (identifier))))))))

==================
Extend and Aggregate
==================
FROM orders
|> EXTEND quantity * price AS total_cost
|> AGGREGATE SUM(total_cost) AS revenue, COUNT(*) AS count GROUP BY region

---

(source_file
  (statement
    (query_expression
      (from_clause (table_expression (identifier)))
      (pipe_operation
        (pipe_extend
          (alias_expression
            (expression
              (binary_expression
                (expression (identifier))
                (expression (identifier))))
            (identifier))))
      (pipe_operation
        (pipe_aggregate
          (alias_expression
            (expression
              (function_call
                (function_name (identifier))
                (expression (identifier))))
            (identifier))
          (alias_expression
            (expression
              (function_call
                (function_name (identifier))
                (expression (star))))
            (identifier))
          (group_by_clause
            (expression (identifier))))))))

==================
Join and Window
==================
FROM t1 AS a
|> JOIN t2 AS b ON a.id = b.id
|> EXTEND RANK() OVER (ORDER BY b.score DESC) AS rk

---

(source_file
  (statement
    (query_expression
      (from_clause
        (table_expression (identifier) (identifier)))
      (pipe_operation
        (pipe_join
          (table_expression (identifier) (identifier))
          (join_condition
            (expression
              (binary_expression
                (expression (identifier))
                (expression (identifier)))))))
      (pipe_operation
        (pipe_extend
          (alias_expression
            (expression
              (function_call
                (function_name (identifier))
                (over_clause
                  (order_by_clause
                    (order_expression
                      (expression (identifier)))))))
            (identifier)))))))
