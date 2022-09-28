const globals = require("../globals");

function checkTable(database, tableList, tableName, tableFormat, tableCreate){
	if(!tableList.includes(tableName)){
		database.prepare(tableCreate).run();
		return;
	}
	let columns = database.prepare("SELECT * FROM pragma_table_info(?) ORDER BY cid ASC;").all(tableName);
	let actualTableFormat = columns.sort((a, b) => a.name < b.name ? -1 : (a.name > b.name ? 1 : 0)).map(v => v.name + "|" + v.type[0]).join("|");
	if(tableFormat !== actualTableFormat){
		let index = 1;
		while(tables.includes("____BACKUP_" + tableName + "_" + index)){
			++index;
		}
		database.prepare("ALTER TABLE accounts RENAME TO ____BACKUP_" + tableName + "_" + index).run();
		database.prepare(tableCreate).run();
	}
}

module.exports = {
	prepareMainDatabase(){
		var tables = globals.database.prepare("SELECT name FROM sqlite_master WHERE type = ?").all("table").map(v => v.name);
		checkTable(globals.database, tables, "accounts", "ad_id|B|brand|I|id|T|identifier|B|model|I|name|T|platform|I|rank|I|region|I|stones|I|unique_id|B|user_id|I|version|I|zeni|I", `CREATE TABLE "accounts" ("id" TEXT NOT NULL UNIQUE, "user_id" INTEGER NOT NULL, "name" TEXT NOT NULL, "rank" INTEGER, "stones" INTEGER, "zeni" INTEGER, "region" INTEGER NOT NULL, "identifier" BLOB, "platform" INTEGER NOT NULL, "brand" INTEGER NOT NULL, "model" INTEGER NOT NULL, "version" INTEGER NOT NULL, "ad_id" BLOB NOT NULL, "unique_id" BLOB NOT NULL, PRIMARY KEY("id"))`);
	}
}