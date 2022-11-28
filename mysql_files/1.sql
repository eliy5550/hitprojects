truncate projectupdates;

select * from projectupdates;

insert into projectupdates 
(pid , date , description , whoWasThere) values 
(2 , current_date() , "TASK COMPLETE!" , "student name")

update task set isDone = 1 where tid=4;insert into projectupdates (pid , date , description , whoWasThere) values (2 , current_date() , "TASK COMPLETE!" , guest);

