SELECT `T0`.`과목`,
       `T0`.`응시자 수`,
       `T0`.`평균`,
       `T0`.`최고 득점`,
       `T2`.`name` AS `최고 득점자`,
       `T0`.`최저 득점`
FROM (SELECT `T0`.`text`                    AS `과목`,
             `T0`.`code`                    AS `과목 코드`,
             COUNT(`T1`.`student_number`)   AS `응시자 수`,
             TRUNCATE(AVG(`T1`.`value`), 2) AS `평균`,
             MAX(`T1`.`value`)              AS `최고 득점`,
             MIN(`T1`.`value`)              AS `최저 득점`
      FROM `school`.`subjects` AS `T0`
               LEFT JOIN `school`.`scores` AS `T1` ON `T0`.`code` = `T1`.`subject_code`
      GROUP BY `T0`.`code`) AS `T0`
         LEFT JOIN `school`.`scores` AS `T1` ON `T0`.`과목 코드` = `T1`.`subject_code` AND `T0`.`최고 득점` = `T1`.`value`
    /* 서브쿼리에서 가져온 `과목 코드`와 `T1`의 `subject_code`(과목 코드)가 같고, 서브쿼리에서 가져온 `최고 득점`과 `T1`의 `value`(점수)가 같다면, 즉, 과목이 같고 최고 점수가 어떠한 응시자의 득점과 같다면, 이는 해당 응시자가 최고 득점자라고 보아야 함. */
/* 단, `T1`은 `scores` 테이블이고, 이는 응시자의 학년, 반, 번호는 가지고 있으나, 이름은 가지고 있지 않음으로 `T1`의 정보를 토대로 `students`에 대해 다시 조인하여 이름을 가지고 와야함. */
         LEFT JOIN `school`.`students` AS `T2` ON `T1`.`student_grade` = `T2`.`grade` AND `T1`.`student_class` = `T2`.`class` AND `T1`.`student_number` = `T2`.`number`
/* `T1`에서 얻어온 학년, 반, 번호를 토대로 이름을 얻어올 수 있음. */;
