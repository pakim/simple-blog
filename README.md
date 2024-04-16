<h2>Database Table Queries</h2>
<pre>
  create table users (
    id serial primary key,
    email varchar(100) unique not null,
    password varchar(100) not null
  );
</pre>
<pre>
  create table posts (
    id serial primary key,
    title text,
    body text,
    date_created varchar(30),
    updated boolean,
    user_id int,
    foreign key (user_id) references users(id)
  );
</pre>

<h2>Environment variables (.env)</h2>
Create a .env file in the project
<pre>
  SESSION_SECRET="{secretword}"
  PG_USER="{username}"
  PG_HOST="{hostname}"
  PG_DATABASE="{databasename}"
  PG_PASSWORD="{databasepassword}"
  PG_PORT="{databaseport}"
  SALT_ROUNDS="{numberofsaltrounds}"
</pre>
Replace curly braces with your own postgres database info.
