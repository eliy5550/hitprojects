delete from project where pid = 1;

select * from project;
UPDATE project set title= 'AR Project', description = 'desc',  category = 'cat' , start= 'start' , finish = 'finish' , grade = 1 , maxStudents = 3 where pid = 1;
