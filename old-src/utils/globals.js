module.exports = {
	agents: {
		android: "Dalvik/2.1.0 (Linux; Android 9.0; SM-S10)",
		ios: "CFNetwork/808.3 Darwin/16.3.0 (iPhone; CPU iPhone OS 13_0 like Mac OS X)"
	},
	assetVersions: {
		global: 0,
		japan: 0
	},
	baseUrls: {
		global: "",
		japan: ""
	},
	bundles: {
		global: {
			android: "com.bandainamcogames.dbzdokkanww",
			ios: "jp.co.bandainamcogames.BNGI0221"
		},
		japan: {
			android: "com.bandainamcogames.dbzdokkan",
			ios: "jp.co.bandainamcogames.BNGI0211"
		}
	},
	/** @type {import("better-sqlite3").Database} */
	database: null,
	databasePasswords: {
		global: "",
		japan: ""
	},
	databaseVersions: {
		global: 0,
		japan: 0
	},
	hosts: {
		global: "",
		japan: ""
	},
	ports: {
		global: 443,
		japan: 443
	},
	signaturePasswords: {
		global: "",
		japan: ""
	},
	/** @type {import("better-sqlite3").Database[]} */
	userDatabases: [],
	versions: {
		global: {
			android: "",
			ios: ""
		},
		japan: {
			android: "",
			ios: ""
		}
	}
}