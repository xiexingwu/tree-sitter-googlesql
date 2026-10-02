==================
SELECT AS STRUCT and SELECT AS VALUE
==================
SELECT ARRAY(SELECT AS STRUCT a, b FROM t), (SELECT AS VALUE x FROM t LIMIT 1)

---

(source_file
  (statement
    (query_expression
      (select_statement
        (keyword_select)
        (alias_expression
          (expression
            (array_expression
              (keyword_array)
              (subquery
                (query_expression
                  (select_statement
                    (keyword_select)
                    (select_as
                      (keyword_as)
                      (keyword_struct))
                    (alias_expression
                      (expression
                        (identifier)))
                    (alias_expression
                      (expression
                        (identifier)))
                    (from_clause
                      (keyword_from)
                      (table_expression
                        (identifier)))))))))
        (alias_expression
          (expression
            (subquery
              (query_expression
                (select_statement
                  (keyword_select)
                  (select_as
                    (keyword_as)
                    (keyword_value))
                  (alias_expression
                    (expression
                      (identifier)))
                  (from_clause
                    (keyword_from)
                    (table_expression
                      (identifier)))
                  (limit_clause
                    (keyword_limit)
                    (number)))))))))))

==================
SELECT * EXCEPT and REPLACE
==================
SELECT * EXCEPT (a, b) REPLACE (c + 1 AS c), t.*, s.* EXCEPT (d)
FROM t

---

(source_file
  (statement
    (query_expression
      (select_statement
        (keyword_select)
        (select_star
          (star)
          (star_except
            (keyword_except)
            (identifier)
            (identifier))
          (star_replace
            (keyword_replace)
            (alias_expression
              (expression
                (binary_expression
                  (expression
                    (identifier))
                  (expression
                    (number))))
              (keyword_as)
              (identifier))))
        (select_star
          (expression
            (identifier))
          (star))
        (select_star
          (expression
            (identifier))
          (star)
          (star_except
            (keyword_except)
            (identifier)))
        (from_clause
          (keyword_from)
          (table_expression
            (identifier)))))))

==================
Joins, UNNEST and implicit aliases
==================
SELECT h.x
FROM `proj`.`ds`.`tbl` t
LEFT JOIN other o ON t.id = o.id
CROSS JOIN UNNEST(t.hits) AS h WITH OFFSET AS pos
FULL OUTER JOIN (SELECT 1 AS id) s USING (id)
WHERE h.y IN UNNEST(@list) AND h.z NOT IN (SELECT z FROM zs)

---

(source_file
  (statement
    (query_expression
      (select_statement
        (keyword_select)
        (alias_expression
          (expression
            (identifier)))
        (from_clause
          (keyword_from)
          (table_expression
            (identifier)
            (identifier))
          (join_clause
            (keyword_left)
            (keyword_join)
            (table_expression
              (identifier)
              (identifier))
            (join_condition
              (keyword_on)
              (expression
                (binary_expression
                  (expression
                    (identifier))
                  (expression
                    (identifier))))))
          (join_clause
            (keyword_cross)
            (keyword_join)
            (table_expression
              (unnest_expression
                (keyword_unnest)
                (expression
                  (identifier)))
              (keyword_as)
              (identifier)
              (keyword_with)
              (keyword_offset)
              (keyword_as)
              (identifier)))
          (join_clause
            (keyword_full)
            (keyword_outer)
            (keyword_join)
            (table_expression
              (subquery
                (query_expression
                  (select_statement
                    (keyword_select)
                    (alias_expression
                      (expression
                        (number))
                      (keyword_as)
                      (identifier)))))
              (identifier))
            (join_condition
              (keyword_using)
              (identifier))))
        (where_clause
          (keyword_where)
          (expression
            (binary_expression
              (expression
                (in_expression
                  (expression
                    (identifier))
                  (keyword_in)
                  (unnest_expression
                    (keyword_unnest)
                    (expression
                      (parameter)))))
              (keyword_and)
              (expression
                (in_expression
                  (expression
                    (identifier))
                  (keyword_not)
                  (keyword_in)
                  (query_expression
                    (select_statement
                      (keyword_select)
                      (alias_expression
                        (expression
                          (identifier)))
                      (from_clause
                        (keyword_from)
                        (table_expression
                          (identifier))))))))))))))

==================
Set operations, QUALIFY and WINDOW
==================
WITH a AS (SELECT 1 AS x)
SELECT x FROM a
QUALIFY ROW_NUMBER() OVER w = 1
WINDOW w AS (PARTITION BY x ORDER BY x DESC NULLS LAST)
UNION ALL
SELECT 2
EXCEPT DISTINCT
(SELECT 3)

---

(source_file
  (statement
    (query_expression
      (with_clause
        (keyword_with)
        (cte_definition
          (identifier)
          (keyword_as)
          (query_expression
            (select_statement
              (keyword_select)
              (alias_expression
                (expression
                  (number))
                (keyword_as)
                (identifier))))))
      (set_operation
        (set_operation
          (select_statement
            (keyword_select)
            (alias_expression
              (expression
                (identifier)))
            (from_clause
              (keyword_from)
              (table_expression
                (identifier)))
            (qualify_clause
              (keyword_qualify)
              (expression
                (binary_expression
                  (expression
                    (function_call
                      (function_name
                        (identifier))
                      (over_clause
                        (keyword_over)
                        (identifier))))
                  (expression
                    (number)))))
            (window_clause
              (keyword_window)
              (window_definition
                (identifier)
                (keyword_as)
                (partition_by_clause
                  (keyword_partition)
                  (keyword_by)
                  (expression
                    (identifier)))
                (order_by_clause
                  (keyword_order)
                  (keyword_by)
                  (order_expression
                    (expression
                      (identifier))
                    (keyword_desc)
                    (keyword_nulls)
                    (keyword_last))))))
          (set_operator
            (keyword_union)
            (keyword_all))
          (select_statement
            (keyword_select)
            (alias_expression
              (expression
                (number)))))
        (set_operator
          (keyword_except)
          (keyword_distinct))
        (subquery
          (query_expression
            (select_statement
              (keyword_select)
              (alias_expression
                (expression
                  (number))))))))))

==================
UNPIVOT
==================
SELECT * FROM t UNPIVOT (val FOR col IN (a, b AS 'B'))

---

(source_file
  (statement
    (query_expression
      (select_statement
        (keyword_select)
        (select_star
          (star))
        (from_clause
          (keyword_from)
          (table_expression
            (identifier)
            (unpivot_clause
              (keyword_unpivot)
              (identifier)
              (keyword_for)
              (identifier)
              (keyword_in)
              (identifier)
              (identifier)
              (keyword_as)
              (string))))))))
