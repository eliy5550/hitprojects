use hit;
create table if not exists  Student(
	sid int not null auto_increment primary key, id int ,fullName varchar(255), pass varchar(255), email varchar(255), phoneNumber varchar(255), pid int
);

create table if not exists Admins(
	aid int not null auto_increment primary key, id int ,fullName varchar(255), pass varchar(255), email varchar(255), phoneNumber varchar(255)
);

create table if not exists Manager(
	sid int not null auto_increment primary key, id int ,fullName varchar(255), pass varchar(255), email varchar(255), phoneNumber varchar(255)
);

create table if not exists Project
(pid int not null auto_increment primary key, title varchar(255),
 description text , category varchar(255), date varchar(255) , finish varchar(255), grade int, maxStudents int, zipPath varchar(255));

create table if not exists _Manager_Project
(mid int , pid int) ;

create table if not exists Task
(tid int not null auto_increment primary key,
 pid int not null, title varchar(255), stage varchar(255), descriptionText text, 
 deadline varchar(255) , isDone boolean , whenDone varchar(255), zipDescription text , zipPath text);

create table if not exists 
_Student_Task(sid int not null , tid int not null);

drop table ProjectUpdates;
create table if not exists 
ProjectUpdates(uid int primary key not null auto_increment,pid int , date varchar(255), description text, whoWasThere text, zipPath text);


create table if not exists 
ProjectCategories(categoryName varchar(255));
use hit;
select * from student inner join project on student.pid = project.pid inner join task on project.pid = task.pid where sid = 3;
select * from student inner join project on student.pid = project.pid where sid=3;
select * from projectupdates where pid = 13 order by date;