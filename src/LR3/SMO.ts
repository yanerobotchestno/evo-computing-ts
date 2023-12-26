enum StopCriteria {
    Iteration,
    Population,
    Fitness
}

class Member {
    genes: number[];
    fitness: number;

    constructor(genes: number[], fitness: number) {
        this.genes = genes;
        this.fitness = fitness;
    }
}

const randomNumberInRange = (min: number, max: number) => (Math.random() * (max - min + 1) + min);

class Population {
    entities: Member[];

    constructor(entities: Member[]) {
        this.entities = entities;
    }

    get bestEntity(): Member {
        return this.entities.reduce((best, member) => best.fitness < member.fitness ? best : member);
    }
}


class SymbioticOptimization {
    private criteria: StopCriteria;
    private population: Population;
    private fitnessFunction: (genes: number[]) => number;
    private maxIterations: number;
    private currentIteration: number = 0;
    private populationDistanceThreshold: number;
    private fitnessChangeThreshold: number;
    private previousAverageFitness: number | null = null;

    private XminimumConstraint: number;
    private XmaximumConstraint: number;

    private YminimumConstraint: number;
    private YmaximumConstraint: number;

    private BF1: number;
    private BF2: number;

    constructor(fitnessFunction: (genes: number[]) => number,
                ecoSize: number, maxIterations: number,
                populationDistanceThreshold: number,
                fitnessChangeThreshold: number,
                XminimumConstraint: number,
                XmaximumConstraint: number,
                YminimumConstraint: number,
                YmaximumConstraint: number,
                BF1: number,
                BF2: number,
                criteria: StopCriteria) {
        this.criteria = criteria;
        this.BF1 = BF1;
        this.BF2 = BF2;

        this.XminimumConstraint = XminimumConstraint;
        this.XmaximumConstraint = XmaximumConstraint;
        this.YminimumConstraint = YminimumConstraint;
        this.YmaximumConstraint = YmaximumConstraint;

        this.fitnessFunction = fitnessFunction;
        this.maxIterations = maxIterations;
        this.populationDistanceThreshold = populationDistanceThreshold;
        this.fitnessChangeThreshold = fitnessChangeThreshold;
        this.initializePopulation(ecoSize);
    }

    private initializePopulation(ecoSize: number): void {
        const entities: Member[] = [];
        for (let i = 0; i < ecoSize; i++) {
            const genes: number[] = this.generateRandomGenes();
            const fitness = this.fitnessFunction(genes);
            entities.push(new Member(genes, fitness));
        }
        this.population = new Population(entities);
    }

    private generateRandomGenes(): number[] {
        return [randomNumberInRange(this.XminimumConstraint, this.XmaximumConstraint), randomNumberInRange(this.YminimumConstraint, this.YmaximumConstraint)];
    }

    public run(): Member {
        while (!this.isTerminationConditionMet(this.criteria)) {
            this.currentIteration++;
            this.population.entities.forEach((member, index) => {
                this.mutualismPhase(member, index);
                this.commensalismPhase(member, index);
                this.parasitismPhase(member, index);
            });
        }
        return this.population.bestEntity;
    }

    private isTerminationConditionMet(criteria: StopCriteria): boolean {

        if (criteria === StopCriteria.Iteration) {
            return this.currentIteration >= this.maxIterations;
        }

        if (criteria === StopCriteria.Population) {
            return this.isPopulationDistanceBelowThreshold();
        }

        if (criteria === StopCriteria.Fitness) {
            return this.isAverageFitnessChangeBelowThreshold();
        }

        return false;
    }

    private isPopulationDistanceBelowThreshold(): boolean {
        const fitnessValues = this.population.entities.map(member => member.fitness);
        const mean = this.calculateMean(fitnessValues);
        const standardDeviation = this.calculateStandardDeviation(fitnessValues, mean);

        return standardDeviation < this.populationDistanceThreshold;
    }

    private calculateMean(values: number[]): number {
        const sum = values.reduce((acc, val) => acc + val, 0);
        return sum / values.length;
    }

    private calculateStandardDeviation(values: number[], mean: number): number {
        const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
        return Math.sqrt(variance);
    }

    private isAverageFitnessChangeBelowThreshold(): boolean {
        const currentAverageFitness = this.calculateAverageFitness();
        if (this.previousAverageFitness !== null && Math.abs(currentAverageFitness - this.previousAverageFitness) < this.fitnessChangeThreshold) {
            return true;
        }
        this.previousAverageFitness = currentAverageFitness;
        return false;
    }

    private calculateAverageFitness(): number {
        const totalFitness = this.population.entities.reduce((acc, member) => acc + member.fitness, 0);
        return totalFitness / this.population.entities.length;
    }

    private mutualismPhase(member: Member, index: number): void {
        const otherEntityIndex = this.getRandomIndexExcept(index);
        const otherEntity = this.population.entities[otherEntityIndex];

        const mutualVector = member.genes.map((gene, idx) => (gene + otherEntity.genes[idx]) / 2);

        for (let i = 0; i < member.genes.length; i++) {
            member.genes[i] += Math.random() * (this.population.bestEntity.genes[i] - mutualVector[i]) * this.BF1;
        }

        for (let i = 0; i < otherEntity.genes.length; i++) {
            otherEntity.genes[i] += Math.random() * (this.population.bestEntity.genes[i] - mutualVector[i]) * this.BF2;
        }

        member.fitness = this.fitnessFunction(member.genes);
        otherEntity.fitness = this.fitnessFunction(otherEntity.genes);
    }

    private commensalismPhase(member: Member, index: number): void {
        const otherEntity = this.population.entities[this.getRandomIndexExcept(index)];
        const BF = this.BF1;

        for (let i = 0; i < member.genes.length; i++) {
            member.genes[i] += randomNumberInRange(-1, 1) * (this.population.bestEntity.genes[i] - otherEntity.genes[i]) * BF;
        }

        member.fitness = this.fitnessFunction(member.genes);
    }

    private parasitismPhase(member: Member, index: number): void {
        const parasite = new Member([...member.genes], member.fitness);
        for (let i = 0; i < parasite.genes.length; i++) {
            parasite.genes[i] += Math.random() - 0.5; // Небольшое изменение генов
        }
        parasite.fitness = this.fitnessFunction(parasite.genes);

        const targetIndex = this.getRandomIndexExcept(index);
        if (parasite.fitness < this.population.entities[targetIndex].fitness) {
            this.population.entities[targetIndex] = parasite;
        }
    }

    private getRandomIndexExcept(index: number): number {
        let randomIndex;
        do {
            randomIndex = Math.floor(Math.random() * this.population.entities.length);
        } while (randomIndex === index);
        return randomIndex;
    }

}

function matiyasFunction(genes: number[]): number {
    const x = genes[0];
    const y = genes[1];
    return 0.26 * (x * x + y * y) - 0.48 * x * y;
}


function MSO() {


    const ecoSize = 50;
    const maxIterations = 1000;
    const populationDistanceThreshold = 0.01;
    const fitnessChangeThreshold = 0.001;

    const XminimumConstraint: number = -10;
    const XmaximumConstraint: number = 10;

    const YminimumConstraint: number = -10;
    const YmaximumConstraint: number = 10;
    const stopCriteria: StopCriteria = StopCriteria.Fitness;

    const BF1 = 1;
    const BF2 = 1;

    const optimization = new SymbioticOptimization(matiyasFunction, ecoSize, maxIterations, populationDistanceThreshold, fitnessChangeThreshold, XminimumConstraint, XmaximumConstraint, YminimumConstraint, YmaximumConstraint, BF1, BF2,
        stopCriteria);

    const bestEntity = optimization.run();

    console.log("Лучшая найденная сущность:", JSON.stringify(bestEntity, null, 2));
    console.log(`Гены: ${bestEntity.genes.join(', ')}`);
    console.log(`Приспособленность: ${bestEntity.fitness}`);

}
const st = performance.now();
MSO();
console.log(performance.now() - st)