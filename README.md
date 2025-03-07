# odin-members-only
odin23. This is a members only message board where only members can see the author of a post.

Schema of the users table:
   Column   |            Type             | Collation | Nullable |              Default              
------------+-----------------------------+-----------+----------+-----------------------------------
 id         | integer                     |           | not null | nextval('users_id_seq'::regclass)
 username   | character varying(50)       |           | not null | 
 password   | text                        |           | not null | 
 first_name | character varying(50)       |           | not null | 
 last_name  | character varying(50)       |           | not null | 
 is_member  | boolean                     |           |          | false
 is_admin   | boolean                     |           |          | false
 created_at | timestamp without time zone |           |          | CURRENT_TIMESTAMP
 Indexes:
    "users_pkey" PRIMARY KEY, btree (id)
    "users_username_key" UNIQUE CONSTRAINT, btree (username)
 
 Schema of the messages table:
   Column   |            Type             | Collation | Nullable |                   Default                    
------------+-----------------------------+-----------+----------+----------------------------------------------
 message_id | integer                     |           | not null | nextval('messages_message_id_seq'::regclass)
 user_id    | integer                     |           | not null | 
 message    | text                        |           | not null | 
 created_at | timestamp without time zone |           |          | CURRENT_TIMESTAMP
Indexes:
    "messages_pkey" PRIMARY KEY, btree (message_id)
Foreign-key constraints:
    "messages_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE

test user info:
testuserone
12345