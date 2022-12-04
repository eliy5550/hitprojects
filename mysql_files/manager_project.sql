select * from _manager_project;
select * from project;
select * from manager;
select * from student;
insert into _manager_project value(1, 17);
truncate _manager_project;

select _manager_project.pid , manager.mid , manager.fullName , manager.email , manager.phoneNumber from _manager_project join manager on _manager_project.mid = manager.mid where pid = 17;
select _manager_project.mid , _manager_project.pid , project.title , project.category from _manager_project left join project on _manager_project.pid = project.pid where mid=1;
