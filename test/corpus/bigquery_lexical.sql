==================
Dotted and backticked paths
==================
SELECT a.b.c, `proj.ds.tbl`.col
FROM `cloudlake-dbt`.`daily`.`Exits`

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
            (identifier)))))))

==================
Raw, bytes and triple-quoted strings
==================
SELECT r"a\d+", R'x', b"bytes", rb'\x00', 'it\'s', """multi
line""", ''''''

---

(source_file
  (statement
    (query_expression
      (select_statement
        (keyword_select)
        (alias_expression
          (expression
            (string)))
        (alias_expression
          (expression
            (string)))
        (alias_expression
          (expression
            (string)))
        (alias_expression
          (expression
            (string)))
        (alias_expression
          (expression
            (string)))
        (alias_expression
          (expression
            (string)))
        (alias_expression
          (expression
            (string)))))))

==================
Operator precedence and inequality
==================
SELECT -x, NOT a = 1 AND b != 2 OR c <> 3, 'a' || 'b', @param
FROM t
WHERE x IS NULL AND y = NULL

---

(source_file
  (statement
    (query_expression
      (select_statement
        (keyword_select)
        (alias_expression
          (expression
            (unary_expression
              (expression
                (identifier)))))
        (alias_expression
          (expression
            (binary_expression
              (expression
                (binary_expression
                  (expression
                    (unary_expression
                      (keyword_not)
                      (expression
                        (binary_expression
                          (expression
                            (identifier))
                          (expression
                            (number))))))
                  (keyword_and)
                  (expression
                    (binary_expression
                      (expression
                        (identifier))
                      (expression
                        (number))))))
              (keyword_or)
              (expression
                (binary_expression
                  (expression
                    (identifier))
                  (expression
                    (number)))))))
        (alias_expression
          (expression
            (binary_expression
              (expression
                (string))
              (expression
                (string)))))
        (alias_expression
          (expression
            (parameter)))
        (from_clause
          (keyword_from)
          (table_expression
            (identifier)))
        (where_clause
          (keyword_where)
          (expression
            (binary_expression
              (expression
                (is_expression
                  (expression
                    (identifier))
                  (keyword_is)
                  (keyword_null)))
              (keyword_and)
              (expression
                (binary_expression
                  (expression
                    (identifier))
                  (expression
                    (keyword_null)))))))))))
