==================
Comma Join and UNNEST
==================
FROM my_table, UNNEST(tags) AS t
|> SELECT t

---

(source_file
  (statement
    (query_expression
      (from_clause
        (keyword_from)
        (table_expression
          (identifier))
        (table_expression
          (unnest_expression
            (keyword_unnest)
            (expression
              (identifier)))
          (keyword_as)
          (identifier)))
      (pipe_operation
        (pipe_select
          (keyword_select)
          (alias_expression
            (expression
              (identifier))))))))
