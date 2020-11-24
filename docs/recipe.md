# Recipe Files
A Recipe is a YAML document that describes how to deploy a server properly: from downloading resources, to configuring the `server.cfg` file.  
You can run a recipe from txAdmin's built-in Server Deployer.  
Recipes will be "jailed" to the target folder, so for example they won't be able to execute `write_file` to your `admins.json`.  
At the end of the deployment process, your target folder will be checked for the presence of a `server.cfg` and a `resources` folder to make sure everything went correctly.  
On the setup page you will be able to import a recipe via its URL or by selecting one of the recommended ones from the community.  
**If you want to run your own recipes, select the `CFX Default` from the setup page then customize it before executing.**  
  
Example recipe:
```yaml
name: PlumeESX2
version: v1.2.3
author: Toybarra
description: |-
    A full featured (8 jobs) and highly configurable yet lightweight ESX v2 base that can be easily extendable. 
    Please join our discord to know more: http://discord.gg/example.

variables:
    dbHost: localhost
    dbUsername: root
    dbPassword: ""
    dbName: null

tasks: 
    - action: download_file
      url: https://github.com/citizenfx/cfx-server-data/archive/master.zip
      path: ./tmp/cfx-server-data.zip

    - action: another_task
      optionA: aaaa
      optionB: bbbbbb
```


## Meta Data
The recipe accepts the following default meta data:
- `name:` The short name for your recipe. Recommended to be under 24 characters.
- `version:` The version of your recipe.
- `author:` The short name of the author. Recommended to be under 24 characters.
- `description:` A single or multiline description for your recipe. Recommended to be under 256 characters. On YAML you can use multiline strings in many ways, for more information check https://yaml-multiline.info.


## Context Variables
The deployer has a shared context between tasks, and they are initially populated by the `variables` which is used by things like database configuration.  
Hopefully in the next few updates we will introduce an interface to edit those.  
The only default Context Variable is `deploymentID`, which is composed by the shortened recipe name with a hex timestamp which will look something like `PlumeESX_BBC957`.


## Tasks
Tasks are executed sequentially, and any failure in the chain stops the process.  
Attention: careful with the number of spaces used in the indentation.  

### `download_file`
Downloads a file to a specific path.  
- `url:` The URL of the file.
- `path:` The destination path for the downloaded file. This must be a file name and not a path.
```yaml
- action: download_file
  url: https://github.com/citizenfx/cfx-server-data/archive/master.zip
  path: ./tmp/cfx-server-data.zip
```

### `unzip`
Extracts a ZIP file to a target folder. This will not work for tar files.  
- `src:` The source path.
- `dest:` The destination path.
```yaml
- action: unzip
  src: ./tmp/cfx-server-data.zip
  dest: ./tmp
```

### `move_path`
Moves a file or directory. The directory can have contents.
This is an implementation of [fs-extra.move()](https://github.com/jprichardson/node-fs-extra/blob/HEAD/docs/move.md).
- `src:` The source path. This can be either a file or a folder. Cannot be the root path (`./`).
- `dest:` The destination path. Cannot be the root path (`./`).
- `overwrite:` *(optional, boolean)* When set to true, it will replace the destination path if it already exists.
```yaml
- action: move_path
  src: ./tmp/cfx-server-data-master/resources
  dest: ./resources
  overwrite: true
```

### `copy_path`
Copy a file or directory. The directory can have contents.
This is an implementation of [fs-extra.copy()](https://github.com/jprichardson/node-fs-extra/blob/HEAD/docs/copy.md).
- `src:` The source path. Note that if `src` is a directory it will copy everything inside of this directory, not the entire directory itself.
- `dest:` The destination path. Note that if `src` is a file, `dest` cannot be a directory.
- `overwrite:` *(optional, boolean)* When set to `true`, overwrite existing file or directory, default is `true`. Note that the copy operation will silently fail if you set this to `false` and the destination exists. Use the `errorOnExist` option to change this behavior.
- `errorOnExist:` *(optional, boolean)* When overwrite is `false` and the destination exists, throw an error. Default is `false`.
```yaml
- action: copy_path
  src: ./tmp/cfx-server-data-master/resources/
  dest: ./resources
```

### `remove_path`
Removes a file or directory. The directory can have contents. If the path does not exist, silently does nothing.
This is an implementation of [fs-extra.remove()](https://github.com/jprichardson/node-fs-extra/blob/HEAD/docs/remove.md).
- `path:` The path to be removed. Cannot be the root path (`./`).
```yaml
- action: remove_path
  path: ./tmp
```

### `ensure_dir`
Ensures that the directory exists. If the directory structure does not exist, it is created.
This is an implementation of [fs-extra.ensureDir()](https://github.com/jprichardson/node-fs-extra/blob/HEAD/docs/ensureDir.md).
- `path:` The path to be created. Cannot be the root path (`./`).
```yaml
- action: ensure_dir
  path: ./resources
```

### `write_file`
Writes or appends data to a file. If not in the append mode, the file will be overwritten and the directory structure will be created if it doesn't exists.
This is an implementation of [fs-extra.outputFile()](https://github.com/jprichardson/node-fs-extra/blob/HEAD/docs/outputFile.md) and Node's default `fs.appendFile()`.
- `file:` The path of the file to be written to.
- `append:` *(optional, boolean)* When set to true, the data will be appended to the end of the target file instead of overwriting everything.
- `data:` The data to be written to the target path.
```yaml
# Append example
- action: write_file
  file: ./server.cfg
  append: true
  data: |
    ensure example1
    ensure example2

# Write file example
- action: write_file
  file: ./doesntexist/config.json
  data: |
    {
        "someVariable": true,
        "heyLookAnArray": [123, 456]
    }
```

### `replace_string`
Replaces a string in the target file or files array based on a search string.
- `file:` String or array containing tie file(s) to be checked for the replacer string.
- `search:` The String to be searched for.
- `replace:` The String that will replace the `search` one.
```yaml
# Single file
- action: replace_string
  file: ./server.cfg
  search: 'FXServer, but unconfigured'
  replace: 'My cool new recipe!!!'

# Multiple files
- action: replace_string
  file: 
    - ./server.cfg
    - ./doesntexist/config.json
  search: 'omg_replace_this'
  replace: 'got_it!'
```

### `connect_database`
Connects to a MySQL/MariaDB server and creates a database if the dbName variable is null.  
You need to execute this action before the `query_database` to populate the `mysqlCon` variable.  
This action does not have any direct attributes attached to it. Instead it uses the following deployer Context Variables that you have to configure:
- `dbHost:` The IP/Hostname of the database server (usually `localhost`).
- `dbUsername:` The database username (usually `root`).
- `dbPassword:` The database password (usually `""` - an empty string).
- `dbName:` The database name. If set to `null`, a random name will be picked that contains the recipe or server name, followed by a sequential hex like `PlumeESX_BBC957`.
- `dbOverwrite:` *(optional, boolean-ish)* If `dbName` is `null`, and the automatic database name chosen already exists, the deployer will **DELETE** the existing database to replace it. To enable, set this to `yes_delete_existing_database`.
> Note: it is recommended to write recipes that have `dbName: null`, since this is the most seamless experience for inexperienced users.
```yaml
# To create a new database (recommended)
variables:
    dbHost: localhost
    dbUsername: root
    dbPassword: ""
    dbName: null
    dbOverwrite: yes_delete_existing_database

# To use an existing database
variables:
    dbHost: localhost
    dbUsername: root
    dbPassword: ""
    dbName: es_extended

tasks: 
    - action: connect_database
```

### `query_database`
Runs a SQL query in the previously connected database.  
This query can be a file path **OR** a string, but not both at the same time!
You need to execute the `connect_database` before this action.
- `file:` The path of the SQL file to be executed.
- `query:` The query string to be executed.
```yaml
# Running a query from a file
- action: query_database
  path: ./tmp/create_tables.sql

# Running a query from a string
- action: query_database
  query: |
    CREATE TABLE IF NOT EXISTS `users` (
        `id` int(10) unsigned NOT NULL,
        `name` tinytext NOT NULL
    );
    INSERT INTO `users` (`name`) VALUES ('tabarra');
```
