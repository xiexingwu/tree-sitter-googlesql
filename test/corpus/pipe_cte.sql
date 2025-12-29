==================
CTE with Pipe Syntax
==================
WITH
  users_clean AS (
    FROM raw_users |> WHERE id IS NOT NULL
  ),
  sales_clean AS (
    SELECT * FROM raw_sales WHERE amount > 0
  )
FROM users_clean
|> JOIN sales_clean USING (id)

---

(source_file
  (statement
    (with_clause
      (keyword_with)
      (cte_definition
        (identifier)
        (keyword_as)
        (query_expression
          (from_clause
            (keyword_from)
            (table_expression
              (identifier)))
          (pipe_operation
            (pipe_where
              (keyword_where)
              (expression
                (is_expression
                  (expression
                    (identifier))
                  (keyword_is)
                  (keyword_not)
                  (keyword_null)))))))
      (cte_definition
        (identifier)
        (keyword_as)
        (query_expression
          (select_statement
            (keyword_select)
            (alias_expression
              (expression
                (star)))
            (from_clause
              (keyword_from)
              (table_expression
                (identifier)))
            (where_clause
              (keyword_where)
              (expression
                (binary_expression
                  (expression
                    (identifier))
                  (expression
                    (number)))))))))
    (query_expression
      (from_clause
        (keyword_from)
        (table_expression
          (identifier)))
      (pipe_operation
        (pipe_join
          (keyword_join)
          (table_expression
            (identifier))
          (join_condition
            (keyword_using)
            (identifier)))))))
