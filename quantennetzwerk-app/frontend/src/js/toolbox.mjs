import { go_post} from './go_com.mjs';

class Toolbox{
    constructor(){
        this.toolbox = document.getElementById('toolbox');
        this.toolbox.addEventListener('keydown', this.keydown.bind(this));
    }
}