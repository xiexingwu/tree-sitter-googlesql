==================
Scalar Subquery in EXTEND
==================
FROM table
|> EXTEND
     (
       SELECT x.value
       FROM UNNEST(tags) AS x
       WHERE x.key = 'id'
       LIMIT 1
     ) AS NavigationEventId

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
              (subquery
                (query_expression
                  (select_statement
                    (keyword_select)
                    (alias_expression
                      (expression
                        (identifier)))
                    (from_clause
                      (keyword_from)
                      (table_expression
                        (function_call
                          (function_name
                            (identifier))
                          (expression
                            (identifier)))
                        (keyword_as)
                        (identifier)))
                    (where_clause
                      (keyword_where)
                      (expression
                        (binary_expression
                          (expression
                            (identifier))
                          (expression
                            (string)))))
                    (limit_clause
                      (keyword_limit)
                      (number))))))
            (keyword_as)
            (identifier)))))))
