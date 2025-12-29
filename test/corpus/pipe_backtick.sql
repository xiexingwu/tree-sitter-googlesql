==================
Backticked Identifiers
==================
FROM `my-project.my-dataset.my-table`
|> WHERE `column-with-dashes` > 10
|> SELECT `quoted column`

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
              (identifier))))))))
