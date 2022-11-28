use hit;
ALTER TABLE student
MODIFY COLUMN id text not null;
ALTER TABLE manager
MODIFY COLUMN id text not null;
ALTER TABLE admins
MODIFY COLUMN id text not null;

ALTER TABLE student
MODIFY COLUMN id text not null;
ALTER TABLE manager
MODIFY COLUMN id text not null;
ALTER TABLE admins
MODIFY COLUMN id text not null;

ALTER TABLE student
MODIFY COLUMN pass text not null;
ALTER TABLE manager
MODIFY COLUMN pass text not null;
ALTER TABLE admins
MODIFY COLUMN pass text not null;

ALTER TABLE student
MODIFY COLUMN email text not null;
ALTER TABLE manager
MODIFY COLUMN email text not null;
ALTER TABLE admins
MODIFY COLUMN email text not null;

ALTER TABLE manager
drop id ;

ALTER TABLE admins
drop id ;



describe manager;
describe student;
describe admins;