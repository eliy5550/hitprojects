use hit;

truncate projectcategories;

insert into projectcategories values("IOT");
insert into projectcategories values("Full Stack");
insert into projectcategories values("GIS");
insert into projectcategories values("ROBOTICS AND AI");
insert into projectcategories values("Fintech and Blockchain");
insert into projectcategories values("Cyber");
insert into projectcategories values("Medical Fields");
insert into projectcategories values("Drones, 3D Sensors and Models");
insert into projectcategories values("Autonomous Cars and Smart Transit");
insert into projectcategories values("AI and Machine Learning");
insert into projectcategories values("Water Technologies");
insert into projectcategories values("Data Science");
insert into projectcategories values("Wearable Technologies");
select * from projectcategories;


alter table projectcategories add column picpath text default('default.png');
alter table projectcategories drop column picpath;
SET SQL_SAFE_UPDATES = 0;

update projectcategories set picpath='iot.jpg' where categoryName = 'IOT';
update projectcategories set picpath='fullstack.jpg' where categoryName = 'Full Stack';
update projectcategories set picpath='gis.jpg' where categoryName = 'GIS';
update projectcategories set picpath='robotics.jpg' where categoryName = 'ROBOTICS AND AI';
update projectcategories set picpath='blockchain.jpg' where categoryName = 'Fintech and Blockchain';
update projectcategories set picpath='cyber.jpg' where categoryName = 'Cyber';
update projectcategories set picpath='medicine.jpg' where categoryName = 'Medical Fields';
update projectcategories set picpath='sensors.jpg' where categoryName = 'Drones, 3D Sensors and Models';
update projectcategories set picpath='automaticcars.jpg' where categoryName = 'Autonomous Cars and Smart Transit';
update projectcategories set picpath='ai.jpg' where categoryName = 'AI and Machine Learning';
update projectcategories set picpath='water.jpg' where categoryName = 'Water Technologies';
update projectcategories set picpath='ds.jpg' where categoryName = 'Data Science';
update projectcategories set picpath='warable.jpg' where categoryName = 'Wearable Technologies';


