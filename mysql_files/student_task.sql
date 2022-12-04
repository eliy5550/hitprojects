use hit;

create table _student_task(
tid varchar(255),
sid varchar(255)
);

select * from _student_task;
truncate _student_task;
select * from task;
select * from student;

select * from task join student on task.pid = student.pid where tid = 1;

update student set pid=17 where sid = 2;

select * from _student_task join task where task.tid = _student_task.tid


