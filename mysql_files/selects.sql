select * from admins ;
select * from student where email="a@a" ;


select * from manager ;
select * from student ;
select * from project ;
select * from task ;

SET SQL_SAFE_UPDATES = 0;


ALTER TABLE project RENAME COLUMN date TO start;

select * from project where category='IOT'
