==================
Scientific Notation and Decimals
==================
FROM t
|> EXTEND
     1e6 AS million,
     1.5E-10 AS small_num,
     .5 AS half,
     100. AS float_hundred

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
              (number))
            (keyword_as)
            (identifier))
          (alias_expression
            (expression
              (number))
            (keyword_as)
            (identifier))
          (alias_expression
            (expression
              (number))
            (keyword_as)
            (identifier))
          (alias_expression
            (expression
              (number))
            (keyword_as)
            (identifier)))))))
