use hit;

TRUNCATE TABLE task;


select * from task order by deadline desc;

insert into task 
(pid , title , descriptionText, deadline , stage , isDone)
values
(2 , "task2" , "Do this task2 NOW!", "2022-01-29" , "finish" , 0 );
select * from task;
update task set isDone = 1 where tid=1;
insert into task(pid , title , descriptionText, deadline ,isDone , stage ) values(7 , "123" , "123", ",0" , 0 , "Develop" );

delete from task where tid = 1;

select * from projectupdates;
