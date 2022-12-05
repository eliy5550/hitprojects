select * from project;
select * from manager;


alter table project add column projectmanager varchar(255);

update project set projectmanager = null where pid = 17;

select * from project join manager where manager.mid = project.projectmanager;