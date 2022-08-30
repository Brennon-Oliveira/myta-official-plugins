import IUtils from "../../../my-terminal-assistent/bin/Plugins/Interfaces/IUtils.interface";

interface IBranch {
    branch: string,
    locked: boolean
}

export default class LockBranchs {

    utils: IUtils;
    args: Array<string>;
    branchs: Array<IBranch> = [];

    constructor(utils: IUtils, args: Array<string>){
        this.utils = utils;
        this.args = args;
    }

    async trigger(){
        await this.getBranchs()
        await this.selectBranchs()
        await this.run();
    }

    async getBranchs(){
        this.utils.message("Buscando branchs");
        const branchs = await this.utils.exec("git branch -r");
        
        if(branchs.stderr || branchs.error){
            this.utils.error("Houve um erro ao buscar as branchs")
        }

        let branchList = branchs.stdout.trim().split("\n");

        branchList.splice(branchList.findIndex(branch=>branch.includes("HEAD -> ")), 1);

        this.branchs = branchList.map(branch=>{
            return {
                    branch:branch.split("/")[1].trim(),
                    locked: false
                }
            }
        )
        
    }

    async selectBranchs(){
        let selected = 0;
        let choosing = true;
        let message = ""; 
        
        let teste = process.stdin.read(15);
        console.log("Oi")
        // while(choosing){
        //     message = ""
        //     this.branchs.forEach((branch, index)=>{
        //         if(index == selected){
        //             message += "> "
        //         }
        //         message += branch.branch + "\n"
        //     })
        //     console.clear()
        //     process.stdout.write(message);
        //     await this.delay(1)
        // }
        
        
    }

    async run(){

    }

    async delay(seconds: number){
        return await new Promise((resolve, reject)=>{
            setTimeout(()=>{
                resolve(true)
            }, seconds)
        })
    }

}