use hit;
insert into student (id ,fullName , pass, email , phoneNumber ) 
values("208574574" , "Student 1" , "123" , "c@c" , "123456"  );

insert into admins (fullName , pass, email , phoneNumber ) 
values( "Admin 1" , "123" , "a@a" , "0501234567"  );


insert into manager (fullName , pass, email , phoneNumber ) 
values( "Manager1" , "123" , "b@b" , "0501234567"  );

insert into student (id ,fullName , pass, email , phoneNumber ) 
values("123" , "Eliel Yeshayahu" , "Eliel123456" , "c@c" , "0501234567"  );
use hit;

insert into projectcategories VALUES("Community Technologies");

insert into project 
(title , description , category , start ) 
values
("title" , "desc" , "IOT" , CURDATE() );
select * from project;
select * from task;
select * from student;
update student set pid = 14;
select * from student inner join project on student.pid = project.pid inner join task on project.pid = task.pid where sid = 1;
select * from student inner join project on student.pid = project.pid inner join task on project.pid = task.pid where sid = 1;