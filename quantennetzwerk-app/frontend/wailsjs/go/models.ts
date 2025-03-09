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

