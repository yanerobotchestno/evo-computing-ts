import {toString} from "../utils";

enum Linker {
    SUM = 0,
    MAX = 1,
    MIN = 2
}

class TerminalValues {
    private values: { [key: string]: number };

    constructor(initialValues?: { [key: string]: number }) {
        this.values = initialValues || {};
    }

    set(key: string, value: number): void {
        this.values[key] = value;
    }

    get(key: string): number | undefined {
        return this.values[key];
    }

    update(newValues: { [key: string]: number }): void {
        Object.keys(newValues).forEach(key => {
            this.values[key] = newValues[key];
        });
    }

    static from(newValues: { [key: string]: number }): TerminalValues {
        return new TerminalValues(newValues);
    }

    getAll(): { [key: string]: number } {
        return this.values;
    }
}


type Executable = (...args: number[]) => number;

class FunctionUtil {
    private executable: Executable;
    numArgs: number;

    constructor(executable: Executable, numArgs: number) {
        this.executable = executable;
        this.numArgs = numArgs;
    }

    eval(args: number[]): number | null {
        if (args.length !== this.numArgs) {
            return null;
        }
        return this.executable(...args);
    }
}

class Functions {
    static ADD2 = new FunctionUtil((...args: number[]) => args[0] + args[1], 2);
    static SUBTRACT2 = new FunctionUtil((...args: number[]) => args[0] - args[1], 2);
    static MULTIPLY2 = new FunctionUtil((...args: number[]) => args[0] * args[1], 2);
    static DIVIDE2 = new FunctionUtil((...args: number[]) => {
        if (args[1] === 0) return Number.MAX_VALUE;
        return args[0] / args[1];
    }, 2);
    static UNARY_MINUS = new FunctionUtil((...args: number[]) => -args[0], 1);
    static ABS = new FunctionUtil((...args: number[]) => Math.abs(args[0]), 1);
    static POWER = new FunctionUtil((...args: number[]) => Math.pow(args[0], args[1]), 2);
    static SQRT = new FunctionUtil((...args: number[]) => {
        if (args[0] < 0) {
            throw Error("negative square root");
            return Number.NaN;
        }
        return Math.sqrt(args[0]);
    }, 1);
    static SIGMOID = new FunctionUtil((...args: number[]) => args[0] >= 0 ? 1 : -1, 1);
}


class GeneticExpressions {
    private functions: { [key: string]: FunctionUtil };
    private terminals: Set<string>;
    private headLength: number;
    private tailLength: number;
    private geneLength: number;
    private numGenes: number;
    private linker: Linker;
    private mutationProb: number;
    private moveMaxLength: number;
    private moveIsElementsProb: number;
    private moveRisElementsProb: number;
    private functionKeys: string[];
    private terminalKeys: string[];
    private functionTerminalKeys: string[];
    private validationTerminalValues: TerminalValues;

    private _geneticExpressions: string[][] = [];

    constructor(
        functions: { [key: string]: FunctionUtil },
        terminals: string[],
        headLength: number,
        maxArity: number,
        numGenes: number,
        linker: Linker,
        mutationProb: number,
        moveMaxLength: number,
        moveIsElementsProb: number,
        moveRisElementsProb: number
    ) {
        this.functions = functions;
        this.terminals = new Set(terminals);
        this.headLength = headLength;
        this.tailLength = headLength * (maxArity - 1) + 1;
        this.geneLength = this.headLength + this.tailLength;
        this.numGenes = numGenes;
        this.linker = linker;
        this.mutationProb = mutationProb;
        this.moveMaxLength = moveMaxLength;
        this.moveIsElementsProb = moveIsElementsProb;
        this.moveRisElementsProb = moveRisElementsProb;
        this.functionKeys = Object.keys(functions);
        this.terminalKeys = terminals;
        this.functionTerminalKeys = [...this.functionKeys, ...this.terminalKeys];

        const initialValues = terminals.reduce((obj, key) => ({...obj, [key]: 0}), {});
        this.validationTerminalValues = new TerminalValues(initialValues);
    }

    set geneticExpressions(value: string[][]) {
        this._geneticExpressions = value;
    }

    get geneticExpressions(): string[][] {
        return this._geneticExpressions;
    }

    private _evalKExpression(kExpression: string, terminalValues: TerminalValues): number {
        try {
            const kExpressionValid: string[] = [];
            let numArgsNeeded = 0;

            for (let i = kExpression.length - 1; i >= 0; i--) {
                const primitive = kExpression[i];
                if (this.terminals.has(primitive)) {
                    numArgsNeeded--;
                    if (numArgsNeeded < 0) numArgsNeeded = 0;
                    kExpressionValid.unshift(primitive);
                } else if (primitive in this.functions) {
                    numArgsNeeded += this.functions[primitive].numArgs - 1;
                    kExpressionValid.unshift(primitive);
                }
            }

            const queue: number[] = [];
            for (const primitive of kExpressionValid) {
                if (this.terminals.has(primitive)) {
                    const value = terminalValues.get(primitive);
                    if (value !== undefined) {
                        queue.push(value);
                    }
                } else if (primitive in this.functions) {
                    const func = this.functions[primitive];
                    const operands = queue.splice(-func.numArgs);
                    const result = func.eval(operands);
                    if (result !== null) {
                        queue.push(result);
                    }
                }
            }

            return queue.pop() ?? NaN;
        } catch (error) {
            console.error("wrong kExpression:", error);
            return NaN;
        }
    }


    public evalGeneticExpression(geneticExpression: string[], terminalValues: TerminalValues): number {
        // console.log("evalGeneticExpression geneticExpression",geneticExpression);
        // console.log("evalGeneticExpression terminalValues",terminalValues);

        if (!Array.isArray(geneticExpression)) {
            console.log(geneticExpression)
            throw new Error('geneticExpression must be string array');
        }

        if (!(terminalValues instanceof TerminalValues)) {
            throw new Error('terminalValues must be TerminalValues');
        }

        switch (this.linker) {
            case Linker.SUM:
                return toString(geneticExpression.reduce((sum, kExpr) => sum + this._evalKExpression(kExpr, terminalValues), 0));
            case Linker.MAX:
                return toString(Math.max(...geneticExpression.map(kExpr => this._evalKExpression(kExpr, terminalValues))));
            case Linker.MIN:
                return toString(Math.min(...geneticExpression.map(kExpr => this._evalKExpression(kExpr, terminalValues))));
            default:
                throw new Error(`unknown link elem: ${this.linker}`);
        }
    }


    private _randomGeneticExpression(): string[] {
        const geneticExpressions: string[] = [];

        for (let i = 0; i < this.numGenes; i++) {
            let expression = '';

            const functionSymbol = this._randomChoice(this.functionKeys);

            for (let j = 1; j < this.headLength; j++) {
                expression += this._randomChoice(this.functionTerminalKeys);
            }

            for (let k = 0; k < this.tailLength; k++) {
                expression += this._randomChoice(this.terminalKeys);
            }

            expression = functionSymbol + expression;
            geneticExpressions.push(expression);
        }

        console.log("_randomGeneticExpression", geneticExpressions);
        return geneticExpressions;
    }


    public evalFitness(geneticExpression: string[], valuePairs: [number[], number][]): number {
        let fitnessScore = 0;
        for (const [terminalValuesArray, targetValue] of valuePairs) {

            const terminalValues = new TerminalValues();

            terminalValuesArray.forEach((value, index) => {
                const key = this.terminalKeys[index];
                if (key) {
                    terminalValues.set(key, value);
                }
            });

            //console.log('evalFitness', terminalValues);
            console.log("evalFitness geneticExpression", geneticExpression);
            const expressionValue = this.evalGeneticExpression(geneticExpression, terminalValues);
            fitnessScore += Math.abs(expressionValue - targetValue);
            console.log("evalFitness fitnessScore", fitnessScore)
        }
        const result = fitnessScore !== 0 ? 1 / fitnessScore : 0;
        console.log("evalFitness", result);

        return result;
    }


    public evalFitnessScores(geneticExpressions: string[][], valuePairs: [number[], number][]): number[] {
        return geneticExpressions.map(ge => this.evalFitness(ge, valuePairs));
    }

    _select(geneticExpressions: string[][], fitnessScores: number[], numGes: number): string[][] {
        //console.log("_SELECT fitnessScores", fitnessScores);
        const totalFitness = fitnessScores.reduce((sum, score) => sum + score, 0);
        // console.log("_SELECT totalFitness", totalFitness);
        const probabilities = fitnessScores.map(score => score / totalFitness);
        // console.log("_SELECT probabilities", probabilities);
        const arr = Array.from({length: numGes}, () => this._weightedChoice(geneticExpressions, probabilities));
        // console.log("_SELECT ARR", arr)
        return arr;
    }

    private _weightedChoice(array: string[][], weights: number[]): string[] {
        const cumulativeWeights = weights.map((sum => value => sum += value)(0));
        // console.log("_weightedChoice cumulativeWeights", cumulativeWeights);
        const randomValue = Math.random() * cumulativeWeights[cumulativeWeights.length - 1];
        // console.log("_weightedChoice randomValue", randomValue);
        const index = cumulativeWeights.findIndex(sum => sum > randomValue);
        // console.log("_weightedChoice index", index);
        // console.log("_weightedChoice array[index]", array[index]);
        // console.log("_weightedChoice array.length", array.length);
        return array[index];
    }


    private _mutate(geneticExpression: string[]): void {
        for (let i = 0; i < this.numGenes; i++) {
            const gene = geneticExpression[i];
            const index = Math.floor(Math.random() * this.geneLength);

            if (index === 0) {

                const newSymbol = this._randomChoice(this.functionKeys);
                geneticExpression[i] = newSymbol + gene.substring(1);
            } else if (index < this.headLength) {

                const newSymbol = this._randomChoice(this.functionTerminalKeys);
                geneticExpression[i] = this.replaceAt(gene, index, newSymbol);
            } else {
                const newSymbol = this._randomChoice(this.terminalKeys);
                geneticExpression[i] = this.replaceAt(gene, index, newSymbol);
            }
        }
    }

    private replaceAt(string: string, index: number, replacement: string): string {
        return string.substring(0, index) + replacement + string.substring(index + 1);
    }


    private _moveIsElements(geneticExpression: string[]): void {

        const fGeneIndex = Math.floor(Math.random() * this.numGenes);
        let sGeneIndex = Math.floor(Math.random() * this.numGenes);
        while (fGeneIndex === sGeneIndex) {
            sGeneIndex = Math.floor(Math.random() * this.numGenes);
        }

        const fGene = geneticExpression[fGeneIndex];
        let sGene = geneticExpression[sGeneIndex];

        const sequenceLen = Math.min(Math.floor(Math.random() * this.moveMaxLength) + 1, this.geneLength);
        const moveFrom = Math.floor(Math.random() * (fGene.length - sequenceLen));
        const moveTo = Math.floor(Math.random() * (sGene.length - sequenceLen));

        sGene = sGene.slice(0, moveTo) + fGene.slice(moveFrom, moveFrom + sequenceLen) + sGene.slice(moveTo + sequenceLen);

        geneticExpression[sGeneIndex] = sGene;
    }



    _moveRisElements(geneticExpression: string[]): void {
        const fGeneIndex = Math.floor(Math.random() * this.numGenes);
        let sGeneIndex = Math.floor(Math.random() * this.numGenes);
        while (fGeneIndex === sGeneIndex) {
            sGeneIndex = Math.floor(Math.random() * this.numGenes);
        }

        const fGene = geneticExpression[fGeneIndex];
        let sGene = geneticExpression[sGeneIndex];

        let sequenceLen = Math.floor(Math.random() * this.moveMaxLength) + 1;
        let moveFrom = Math.floor(Math.random() * (fGene.length - sequenceLen));
        let attempts = 0;
        while (attempts < 10 && moveFrom + sequenceLen <= fGene.length) {

            const subSequence = Array.from(fGene.slice(moveFrom, moveFrom + sequenceLen));
            if (subSequence.some(c => this.functions.hasOwnProperty(c))) {
                break;
            }
            moveFrom = Math.floor(Math.random() * (fGene.length - sequenceLen));
            attempts++;
        }

        if (sequenceLen > 0 && moveFrom + sequenceLen <= fGene.length && moveFrom + sequenceLen <= sGene.length) {
            const sGeneNewPart = fGene.slice(moveFrom, moveFrom + sequenceLen);
            sGene = sGeneNewPart + sGene.slice(sequenceLen);
            geneticExpression[sGeneIndex] = sGene;
        }
    }

    private _onePointRecombination(fGe: string[], sGe: string[]): [string[], string[]] {

        const fGeStr = fGe.join('');
        const sGeStr = sGe.join('');

        const index = Math.floor(Math.random() * (this.numGenes * this.geneLength));

        const rFGeStr = fGeStr.substring(0, index) + sGeStr.substring(index);
        const rSGeStr = sGeStr.substring(0, index) + fGeStr.substring(index);

        const rFGe: string[] = [];
        const rSGe: string[] = [];

        for (let i = 0; i < this.numGenes; i++) {
            rFGe.push(rFGeStr.substring(i * this.geneLength, (i + 1) * this.geneLength));
            rSGe.push(rSGeStr.substring(i * this.geneLength, (i + 1) * this.geneLength));
        }

        console.log("_onePointRecombination rFGe", rFGe)
        console.log("_onePointRecombination rSGe", rSGe)

        return [rFGe, rSGe];
    }


    private _twoPointRecombination(fGe: string[], sGe: string[]): [string[], string[]] {

        const fGeStr = fGe.join('');
        const sGeStr = sGe.join('');

        const fIndex = Math.floor(Math.random() * (this.numGenes * this.geneLength - 2));
        const sIndex = Math.floor(Math.random() * (this.numGenes * this.geneLength - fIndex - 1)) + fIndex + 1;

        const rFGeStr = fGeStr.substring(0, fIndex) + sGeStr.substring(fIndex, sIndex) + fGeStr.substring(sIndex);
        const rSGeStr = sGeStr.substring(0, fIndex) + fGeStr.substring(fIndex, sIndex) + sGeStr.substring(sIndex);

        const rFGe: string[] = [];
        const rSGe: string[] = [];

        for (let i = 0; i < this.numGenes; i++) {
            rFGe.push(rFGeStr.substring(i * this.geneLength, (i + 1) * this.geneLength));
            rSGe.push(rSGeStr.substring(i * this.geneLength, (i + 1) * this.geneLength));
        }

        console.log("_twoPointRecombination rFGe", rFGe)
        console.log("_twoPointRecombination rSGe", rSGe)

        return [rFGe, rSGe];
    }


    private _fullRecombination(fGe: string[], sGe: string[]): [string[], string[]] {

        const geneIndex = Math.floor(Math.random() * this.numGenes);

        const rFGe = [...fGe];
        const rSGe = [...sGe];

        rFGe[geneIndex] = sGe[geneIndex];
        rSGe[geneIndex] = fGe[geneIndex];

        console.log("_fullRecombination rFGe", rFGe)
        console.log("_fullRecombination rSGe", rSGe)

        return [rFGe, rSGe];
    }


    public generateGeneticExpression(): string[] {
        while (true) {
            const ge = this._randomGeneticExpression();
            console.log("GENERATED", ge);
            try {
                this.evalGeneticExpression(ge, this.validationTerminalValues);
                console.log("NICE GENERATED", ge);
                console.log("this.validationTerminalValues", this.validationTerminalValues);
                return ge;
            } catch (error) {
                console.error("BAD GENERATED", ge);
            }
        }
    }

    public eval(valuePairs: [number[], number][], numGes: number, times: number): string[] {
        let geneticExpressions = Array.from({length: numGes}, () => this.generateGeneticExpression());
        let fitnessScores = this.evalFitnessScores(geneticExpressions, valuePairs);
        let bestGe = geneticExpressions[fitnessScores.indexOf(Math.max(...fitnessScores))];

        for (let time = 0; time < times; time++) {
            this.applyGeneticOperators(geneticExpressions);

            fitnessScores = this.evalFitnessScores(geneticExpressions, valuePairs);
            console.log("eval geneticExpressions", geneticExpressions);
            const currentBest = geneticExpressions[fitnessScores.indexOf(Math.max(...fitnessScores))];
            console.log("eval currentBest", currentBest);
            if (this.evalFitness(currentBest, valuePairs) > this.evalFitness(bestGe, valuePairs)) {
                bestGe = currentBest;
                console.log(`Best on iteration #${time}:`);
                console.log(this.evalFitness(currentBest, valuePairs));
                console.log(currentBest);
                console.log('Test values:');
                valuePairs.forEach(([input, target]) => {
                    console.log('X Y_P Y_T');
                    console.log("eval currentBest", currentBest);
                    console.log(input[0], this.evalGeneticExpression(currentBest, TerminalValues.from({'x': input[0]})), target);
                });
            }

            geneticExpressions = this._select(geneticExpressions, fitnessScores, numGes);
        }

        return bestGe;
    }

    private applyGeneticOperators(geneticExpressions: string[][]): void {

        geneticExpressions.forEach(ge => {
            if (Math.random() < this.mutationProb) {
                console.log("BEFORE _mutate", ge);
                this._mutate(ge);
                console.log("AFTER _mutate", ge);
            }
            if (Math.random() < this.moveIsElementsProb) {
                console.log("BEFORE _moveIsElements", ge);
                this._moveIsElements(ge);
                console.log("AFTER _moveIsElements", ge);
            }
            if (Math.random() < this.moveRisElementsProb) {
                console.log("BEFORE _moveRisElements", ge);
                this._moveRisElements(ge);
                console.log("AFTER _moveRisElements", ge);
            }
        });

        console.log("BEFORE _onePointRecombination", geneticExpressions);

        let [parent1, parent2] = this._randomSample(geneticExpressions, 2);
        let offsprings = this._onePointRecombination(parent1, parent2);
        const _onePointRecombinationResult = [...offsprings];

        const indexOPR1 = geneticExpressions.findIndex((item) => item === parent1);
        geneticExpressions.splice(indexOPR1, 1, _onePointRecombinationResult[0]);

        const indexOPR2 = geneticExpressions.findIndex((item) => item === parent2);
        geneticExpressions.splice(indexOPR2, 1, _onePointRecombinationResult[1]);

        console.log("AFTER _onePointRecombination", geneticExpressions);

        console.log("BEFORE _twoPointRecombination", geneticExpressions);
        [parent1, parent2] = this._randomSample(geneticExpressions, 2);
        offsprings = this._twoPointRecombination(parent1, parent2);
        const _twoPointRecombinationResult = [...offsprings];

        const indexTPR1 = geneticExpressions.findIndex((item) => item === parent1);
        geneticExpressions.splice(indexTPR1, 1, _twoPointRecombinationResult[0]);

        const indexTPR2 = geneticExpressions.findIndex((item) => item === parent2);
        geneticExpressions.splice(indexTPR2, 1, _twoPointRecombinationResult[1]);

        console.log("AFTER _twoPointRecombination", geneticExpressions);

        console.log("BEFORE _fullRecombination", geneticExpressions);
        [parent1, parent2] = this._randomSample(geneticExpressions, 2);

        offsprings = this._fullRecombination(parent1, parent2);

        const _fullRecombinationResult = [...offsprings];

        const indexFR1 = geneticExpressions.findIndex((item) => item === parent1);
        geneticExpressions.splice(indexFR1, 1, _fullRecombinationResult[0]);

        const indexFR2 = geneticExpressions.findIndex((item) => item === parent2);
        geneticExpressions.splice(indexFR2, 1, _fullRecombinationResult[1]);

        console.log("AFTER _fullRecombination", geneticExpressions);
    }


    _randomChoice<T>(array: T[]): T {
        return array[Math.floor(Math.random() * array.length)];
    }

    private _randomSample<T>(array: T[], size: number): T[] {
        const shuffled = [...array].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, size);
    }

    public restoreExpression(geneticExpression: string[]): { expression: string[], linker: Linker } {
        const restoredExpression: string[] = [];

        for (const kExpression of geneticExpression) {
            let kExpressionValid: string[] = [];
            let numArgsNeeded = 0;

            for (let i = 0; i < kExpression.length; i++) {
                const primitive = kExpression[i];
                if (this.functions.hasOwnProperty(primitive)) {
                    numArgsNeeded += this.functions[primitive].numArgs - 1;
                    kExpressionValid.push(primitive);
                } else if (this.terminals.has(primitive)) {
                    numArgsNeeded--;
                    if (numArgsNeeded < 0) numArgsNeeded = 0;
                    kExpressionValid.push(primitive);
                }
            }

            restoredExpression.push(kExpressionValid.join(''));
        }

        return { expression: restoredExpression, linker: this.linker };
    }


}


function runPGV() {
    const valuePairs: [number[], number][] = [
        [[3.4], 2.64],
        [[5.4], 65.04],
        [[6.7], 122.76],
        [[8.2], 206.16],
        [[9.12], 266.2176],
        [[10.25], 349.25],
        [[12.34], 529.7424],
        [[21.43], 1721.26],
        [[23.76], 2133.11],
        [[25.32], 2433.13]
    ];

    const functions = {
        '+': Functions.ADD2,
        '-': Functions.SUBTRACT2,
        '*': Functions.MULTIPLY2,
        '/': Functions.DIVIDE2,
        //'U': Functions.UNARY_MINUS,
        // 'A': Functions.ABS,
        //'P': Functions.POWER,
        // 'S': Functions.SQRT,
    };
//Dmytro Ishchenko KH-41
    const terminals = ['x'];

    const ge = new GeneticExpressions(functions, terminals, 16, 2, 2, Linker.SUM, 0.6, 3, 0.1, 0.1);

    const bestGe = ge.eval(valuePairs, 50, 2);

    const terminalValuesFor10 = new TerminalValues({'x': 10});
    console.log("terminalValuesFor10", terminalValuesFor10);
    const terminalValuesFor20 = new TerminalValues({'x': 20});
    const terminalValuesFor30 = new TerminalValues({'x': 30});

    console.log('F(10) = ', ge.evalGeneticExpression(bestGe, terminalValuesFor10));
    console.log('F(20) = ', ge.evalGeneticExpression(bestGe, terminalValuesFor20));
    console.log('F(30) = ', ge.evalGeneticExpression(bestGe, terminalValuesFor30));

    const restoredExpression = ge.restoreExpression(bestGe);
    console.log(restoredExpression);
}


runPGV()


