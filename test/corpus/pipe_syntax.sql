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
        (keyword_from)
        (table_expression
          (identifier)))
      (pipe_operation
        (pipe_where
          (keyword_where)
          (expression
            (binary_expression
              (expression
                (identifier))
              (expression
                (number))))))
      (pipe_operation
        (pipe_select
          (keyword_select)
          (alias_expression
            (expression
              (identifier)))
          (alias_expression
            (expression
              (identifier))))))))

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
      (from_clause
        (keyword_from)
        (table_expression
          (identifier)))
      (pipe_operation
        (pipe_extend
          (keyword_extend)
          (alias_expression
            (expression
              (binary_expression
                (expression
                  (identifier))
                (expression
                  (identifier))))
            (keyword_as)
            (identifier))))
      (pipe_operation
        (pipe_aggregate
          (keyword_aggregate)
          (alias_expression
            (expression
              (function_call
                (function_name
                  (identifier))
                (expression
                  (identifier))))
            (keyword_as)
            (identifier))
          (alias_expression
            (expression
              (function_call
                (function_name
                  (identifier))
                (expression
                  (star))))
            (keyword_as)
            (identifier))
          (group_by_clause
            (keyword_group)
            (keyword_by)
            (expression
              (identifier))))))))

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
        (keyword_from)
        (table_expression
          (identifier)
          (keyword_as)
          (identifier)))
      (pipe_operation
        (pipe_join
          (keyword_join)
          (table_expression
            (identifier)
            (keyword_as)
            (identifier))
          (join_condition
            (keyword_on)
            (expression
              (binary_expression
                (expression
                  (identifier))
                (expression
                  (identifier)))))))
      (pipe_operation
        (pipe_extend
          (keyword_extend)
          (alias_expression
            (expression
              (function_call
                (function_name
                  (identifier))
                (over_clause
                  (keyword_over)
                  (order_by_clause
                    (keyword_order)
                    (keyword_by)
                    (order_expression
                      (expression
                        (identifier))
                      (keyword_desc))))))
            (keyword_as)
            (identifier)))))))

==================
Logic Operators (BETWEEN, IN, LIKE, CASE)
==================
FROM t
|> WHERE score BETWEEN 10 AND 20
|> WHERE category NOT IN ('A', 'B')
|> WHERE name LIKE 'Google%'
|> EXTEND CASE
     WHEN score > 50 THEN 'Pass'
     ELSE 'Fail'
   END AS status

---

(source_file
  (statement
    (query_expression
      (from_clause
        (keyword_from)
        (table_expression (identifier)))
      (pipe_operation
        (pipe_where
          (keyword_where)
          (expression
            (between_expression
              (expression (identifier))
              (keyword_between)
              (expression (number))
              (keyword_and)
              (expression (number))))))
      (pipe_operation
        (pipe_where
          (keyword_where)
          (expression
            (in_expression
              (expression (identifier))
              (keyword_not)
              (keyword_in)
              (expression (string))
              (expression (string))))))
      (pipe_operation
        (pipe_where
          (keyword_where)
          (expression
            (like_expression
              (expression (identifier))
              (keyword_like)
              (expression (string))))))
      (pipe_operation
        (pipe_extend
          (keyword_extend)
          (alias_expression
            (expression
              (case_expression
                (keyword_case)
                (when_clause
                  (keyword_when)
                  (expression (binary_expression (expression (identifier)) (expression (number))))
                  (keyword_then)
                  (expression (string)))
                (else_clause
                  (keyword_else)
                  (expression (string)))
                (keyword_end)))
            (keyword_as)
            (identifier)))))))
