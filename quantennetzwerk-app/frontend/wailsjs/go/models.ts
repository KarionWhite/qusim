export namespace exec {
	
	export class Context {
	
	
	    static createFrom(source: any = {}) {
	        return new Context(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	
	    }
	}

}

export namespace main {
	
	export class GetJsonData {
	    task: string;
	    success: boolean;
	    data: any;
	
	    static createFrom(source: any = {}) {
	        return new GetJsonData(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.task = source["task"];
	        this.success = source["success"];
	        this.data = source["data"];
	    }
	}
	export class PostJSONData {
	    task: string;
	    data: number[];
	
	    static createFrom(source: any = {}) {
	        return new PostJSONData(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.task = source["task"];
	        this.data = source["data"];
	    }
	}

}

