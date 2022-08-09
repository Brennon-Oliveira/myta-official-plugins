import { Commands } from "../Decorators";
import IUtils from "../Interfaces/IUtils.interface";
import Plugin from "../Plugin";

@Commands([
    "pull",
    "commit"
])
export default class Git extends Plugin{

    async pull(utils: IUtils, args:Array<string>) {
        let {flags} = utils.getFlags(args, {boolFlags: ["s"]})

        let updateSuccess = false;

        let pullResponse = await utils.exec("git pull --rebase");

        if (pullResponse.stderr) {
            let stderr = pullResponse.stderr;
            if (stderr.includes("You have unstaged changes")) {
                utils.error(
                    `
                Você possuí alterações não commitadas.
                `,
                    false
                );
                let howProgress = flags.s ?  "Git stash" : await utils.question(
                    "Como deseja prosseguir:",
                    ["Git stash", "Sair"],
                    true
                )
                if (howProgress === "Git stash") {
                    await utils.exec("git stash")
                    pullResponse = await utils.exec("git pull --rebase")
                    await utils.exec("git stash apply")
                    updateSuccess = true
                } else {
                    process.exit(0);
                }
            }
        } if (pullResponse.stdout) {
            updateSuccess = true
        }
        if(updateSuccess){
            let stdout = pullResponse.stdout;
            if (stdout.includes("Already up to date")){
                utils.success(`
                Branch já atualizada
                `)
            } else if (stdout.includes("up to date")) {
                utils.success(`
                Sua branch foi atualizada com sucesso\n
                ${stdout}`);
            }
        }
    }

    async commit(utils: IUtils, args: Array<string>) {
        let { finalArgs, flags } = utils.getFlags(
            args,
            {
                boolFlags:["a", "p", "u"],
                paramsFlag:["b", "t", "m"]
            }
        );
        let settings = await utils.getSettings();

        let branchs = await utils.exec("git branch");
        let branch =
            branchs.stdout
                .substring(branchs.stdout.indexOf("*"))
                ?.split(" ")[1]
                ?.trim() || "master";

        if (flags.u) {
            utils.message("Atualizando na branch " + branch)
            await utils.exec("git stash");
            await utils.exec("git pull");
            await utils.exec("git stash apply");
        }

        if (flags.b) {
            const {stdout, stderr} = await utils.exec(`git checkout -b ${flags.b}`);
            if(stderr){
                utils.message(`Acessando branch ${flags.b}`)
                await utils.exec("git stash");
                await utils.exec(`git checkout ${flags.b}`)
                await utils.exec("git stash apply");
            } else {
                utils.message(`Criando branch ${flags.b}`)
            }
            branch = <string>flags.b;
        }

        if (flags.a) {
            utils.message("Adicionando todos os arquivos")
            await utils.exec("git add .");
        }

        let commitMessage = "Commit sem mensagem";

        if (flags.m) {
            commitMessage = <string> flags.m;
        }

        let type = "NotDefined";
        if (flags.t) {
            type = <string>flags.t;
        }

        commitMessage = utils.useTemplate(settings["defaultCommitTemplate"], {
            branch: branch,
            message: commitMessage,
            type: type,
        });

        let commit = await utils.exec(`git commit -m "${commitMessage}"`);

        if (commit.stderr) {
            utils.error("Houve um erro ao realizar o commit");
        } else if (commit.stdout) {
            if (commit.stdout.includes("nothing to commit")) {
                utils.warning("Você não possuí alterações para commitar");
            } else if (
                commit.stdout.includes(
                    "nenhuma modificação adicionada à submissão"
                )
            ) {
                utils.warning(`
                Você possuí alterações não adicionadas
                Adicione os arquivos na fila (listando com "git status")
                Ou tente novamente utilizando a flag "-a" para realizar "git add ."
                `);
            } else {
                if (flags.p) {
                    let pushed = await utils.exec(
                        `git push --set-upstream origin ${branch}`
                    );
                    if (
                        pushed.stdout ||
                        pushed.stderr.includes("To github.com")
                    ) {
                        utils.success(`
                        Commit realizado com sucesso:
                            ${commit.stdout}
                        
                        E push realizado com sucesso
                            ${pushed.stdout}
                        `);
                    } else {
                        utils.error(`
                        Commit realizado com sucesso:
                            ${commit.stdout}
                        Mas falha ao realizar o "git push":
                            ${pushed.stderr}
                        `);
                    }
                } else {
                    utils.success(`
                    Commit realizado com sucesso:
                        ${commit.stdout}
                    `);
                }
            }
        }
    }

    async help(utils: IUtils) {
        utils.help("myta git", [
            {
                name: "pull",
                description: "Realiza git pull --rebase",
            },
            {
                name: "commit",
                description: "Realiza commit das alterações atuais",
                flags: [
                    {
                        name: "-b {nome da branch}",
                        description:
                            "Cria uma nova branch para a realizar o commit",
                    },
                    {
                        name: "-t {tipo}",
                        description:
                            "Define o tipo do commit. Padrões conhecios: bugfix (fix), feature (feat), hotfix, release, etc",
                    },
                    {
                        name: '-m "{mensagem de commit}"',
                        description: "Define a mensagem do commit",
                    },
                    {
                        name: "-a",
                        description:
                            'Realiza "git add ." antes de realizar o commit',
                    },
                    {
                        name: "-p",
                        description:
                            'Realiza "git push" após de realizar o commit',
                    },
                    {
                        name: "-u",
                        description:
                            'Realiza "git pull" antes de realizar o commit',
                    },
                ],
            },
        ]);
    }
}
