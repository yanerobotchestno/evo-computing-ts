   class Ant {
    public path: number[];
    public pathLength: number;
    public pheromoneDelta: number[][];

    constructor(numCities: number) {
        this.path = [this.chooseStartingCity()];
        this.pathLength = 0;
        this.pheromoneDelta = Array.from({length: numCities}, () => new Array(numCities).fill(0));
    }

    private chooseStartingCity(): number {
        return 6;
    }

    public run(distances: number[][], pheromone: number[][], alpha: number, beta: number): void {
        while (this.path.length < distances.length) {
            const currentCity = this.path[this.path.length - 1];
            const nextCity = this.chooseNextCity(currentCity, distances, pheromone, alpha, beta);
            this.path.push(nextCity);
        }
        this.path.push(this.path[0]);
        this.pathLength = this.calculatePathLength(this.path, distances);
        this.updatePheromoneDelta(this.path, this.pathLength, pheromone);
    }

    private chooseNextCity(currentCity: number, distances: number[][], pheromone: number[][], alpha: number, beta: number): number {
        const probabilities = distances[currentCity]
            .map((_, nextCity) => {
                if (this.path.includes(nextCity)) {
                    return 0;
                }
                const pheromoneLevel = pheromone[currentCity][nextCity];
                const visibility = 1 / distances[currentCity][nextCity];
                return Math.pow(pheromoneLevel, alpha) * Math.pow(visibility, beta);
            });

        const probabilitySum = probabilities.reduce((acc, prob) => acc + prob, 0);
        const normalizedProbabilities = probabilities.map(prob => prob / probabilitySum);

        return this.rouletteWheelSelect(normalizedProbabilities);
    }

    private rouletteWheelSelect(probabilities: number[]): number {
        const randomThreshold = Math.random();
        let cumulativeSum = 0;
        for (let i = 0; i < probabilities.length; i++) {
            cumulativeSum += probabilities[i];
            if (cumulativeSum >= randomThreshold) {
                return i;
            }
        }
        return probabilities.length - 1;
    }

    private calculatePathLength(path: number[], distances: number[][]): number {
        let length = 0;
        for (let i = 0; i < path.length - 1; i++) {
            length += distances[path[i]][path[i + 1]];
        }
        return length;
    }

    private updatePheromoneDelta(path: number[], pathLength: number, pheromone: number[][]): void {
        const delta = 1 / pathLength;
        for (let i = 0; i < path.length - 1; i++) {
            this.pheromoneDelta[path[i]][path[i + 1]] += delta;
            this.pheromoneDelta[path[i + 1]][path[i]] += delta; // Assuming undirected graph
        }
    }
}

class AntColonyOptimization {
    private bestPathLength: number = Infinity;
    private bestPath: number[] = [];

    private pheromone: number[][];
    private distances: number[][];
    private ants: Ant[];
    private alpha: number;
    private beta: number;
    private evaporationRate: number;

    constructor(distances: number[][], numAnts: number, alpha: number, beta: number, evaporationRate: number) {
        this.distances = distances;
        this.alpha = alpha;
        this.beta = beta;
        this.evaporationRate = evaporationRate;
        this.pheromone = this.initializePheromone(distances.length);
        this.ants = Array.from({length: numAnts}, () => new Ant(distances.length));
    }

    private initializePheromone(numCities: number): number[][] {
        return Array.from({length: numCities}, () => new Array(numCities).fill(1));
    }

    public run(numIterations: number): void {
        for (let iteration = 0; iteration < numIterations; iteration++) {
            this.ants.forEach(ant => {
                ant.run(this.distances, this.pheromone, this.alpha, this.beta);
                if (ant.pathLength < this.bestPathLength) {
                    this.bestPathLength = ant.pathLength;
                    this.bestPath = [...ant.path];
                }
            });
            this.updatePheromone();
        }

        const pathNames = this.bestPath.map(cityNumber => getCityName(cityNumber));
        console.log(`The shortest path found is: ${pathNames.join(' -> ')} with length: ${this.bestPathLength} km`);
    }


    public getBestPath(): number[] {
        return this.bestPath;
    }

    public getBestPathLength(): number {
        return this.bestPathLength;
    }

    private updatePheromone(): void {
        for (let i = 0; i < this.distances.length; i++) {
            for (let j = 0; j < this.distances[i].length; j++) {
                let deltaPheromone = 0;
                this.ants.forEach(ant => {
                    deltaPheromone += ant.pheromoneDelta[i][j];
                });
                this.pheromone[i][j] = (1 - this.evaporationRate) * this.pheromone[i][j] + deltaPheromone;
            }
        }
    }
}

  function getCityName(cityNumber: number): string {
    const cityNames: { [key: number]: string } = {
        0: 'Винница',
        1: 'Днепропетровск',
        2: 'Донецк',
        3: 'Житомир',
        4: 'Запорожье',
        5: 'Ивано-Франковск',
        6: 'Киев',
        7: 'Кировоград',
        8: 'Луганск',
        9: 'Луцк',
        10: 'Львов',
        11: 'Николаев',
        12: 'Одесса',
        13: 'Полтава',
        14: 'Ровно',
        15: 'Симферополь',
        16: 'Сумы',
        17: 'Тернополь',
        18: 'Ужгород',
        19: 'Харьков',
        20: 'Херсон',
        21: 'Хмельницкий',
        22: 'Черкассы',
        23: 'Черновцы',
        24: 'Чернигов'
    };

    return cityNames[cityNumber] || 'Неизвестный город';
}
   //Dmytro Ishchenko KH-41
  const distances: number[][] = [
    [0, 645, 868, 125, 748, 366, 256, 316, 1057, 382, 360, 471, 428, 593, 311, 844, 602, 232, 575, 734, 521, 120, 343, 312, 396],
    [645, 0, 252, 664, 81, 901, 533, 294, 394, 805, 975, 343, 468, 196, 957, 446, 430, 877, 1130, 213, 376, 765, 324, 891, 672],
    [868, 252, 0, 858, 217, 1171, 727, 520, 148, 1111, 1221, 611, 731, 390, 1045, 591, 706, 1100, 1391, 335, 560, 988, 547, 1141, 867],
    [125, 664, 858, 0, 738, 431, 131, 407, 1182, 257, 423, 677, 557, 468, 187, 803, 477, 298, 671, 690, 624, 185, 321, 389, 271],
    [748, 81, 217, 738, 0, 1119, 607, 303, 365, 681, 833, 377, 497, 270, 925, 365, 477, 977, 1488, 287, 297, 875, 405, 957, 747],
    [366, 901, 1171, 431, 1119, 0, 561, 618, 1402, 328, 135, 747, 627, 898, 296, 1070, 908, 134, 280, 1040, 798, 246, 709, 143, 701],
    [256, 533, 727, 131, 607, 561, 0, 298, 811, 388, 550, 490, 489, 337, 318, 972, 346, 427, 806, 478, 551, 315, 190, 538, 149],
    [316, 294, 520, 407, 303, 618, 298, 0, 668, 664, 710, 174, 294, 246, 627, 570, 506, 547, 883, 387, 225, 435, 126, 637, 363],
    [1057, 394, 148, 1182, 365, 1402, 811, 668, 0, 1199, 1379, 857, 977, 474, 1129, 739, 253, 1289, 1539, 333, 806, 1177, 706, 1292, 951],
    [382, 805, 1111, 257, 681, 328, 388, 664, 1199, 0, 152, 780, 856, 725, 70, 1052, 734, 159, 413, 866, 869, 263, 578, 336, 949],
    [360, 975, 1221, 423, 833, 135, 550, 710, 1379, 152, 0, 850, 970, 891, 232, 1173, 896, 128, 261, 1028, 1141, 240, 740, 278, 690],
    [471, 343, 611, 677, 377, 747, 490, 174, 857, 780, 850, 0, 120, 420, 864, 282, 681, 754, 999, 556, 51, 590, 300, 642, 640],
    [428, 468, 731, 557, 497, 627, 489, 294, 977, 856, 970, 120, 0, 540, 741, 392, 800, 660, 1009, 831, 171, 548, 420, 515, 529],
    [593, 196, 390, 468, 270, 898, 337, 246, 474, 725, 891, 420, 540, 0, 665, 635, 261, 825, 1149, 141, 471, 653, 279, 892, 477],
    [311, 957, 1045, 187, 925, 296, 318, 627, 1129, 70, 232, 864, 741, 665, 0, 1157, 664, 162, 484, 805, 834, 193, 508, 331, 458],
    [844, 446, 591, 803, 365, 1070, 972, 570, 739, 1052, 1173, 282, 392, 635, 1157, 0, 896, 1097, 1363, 652, 221, 964, 696, 981, 1112],
    [602, 430, 706, 477, 477, 908, 346, 506, 253, 734, 896, 681, 800, 261, 664, 896, 0, 774, 1138, 190, 732, 662, 540, 883, 350],
    [232, 877, 1100, 298, 977, 134, 427, 547, 1289, 159, 128, 754, 660, 825, 162, 1097, 774, 0, 338, 987, 831, 112, 575, 176, 568],
    [575, 1130, 1391, 671, 1488, 280, 806, 883, 1539, 413, 261, 999, 1009, 1149, 484, 1363, 1138, 338, 0, 1299, 1065, 455, 984, 444, 951],
    [734, 213, 335, 690, 287, 1040, 478, 387, 333, 866, 1028, 556, 831, 141, 805, 652, 190, 987, 1299, 0, 576, 854, 420, 1036, 608],
    [521, 376, 560, 624, 297, 798, 551, 225, 806, 869, 1141, 51, 171, 471, 834, 221, 732, 831, 1065, 576, 0, 641, 351, 713, 691],
    [120, 765, 988, 185, 875, 246, 315, 435, 1177, 263, 240, 590, 548, 653, 193, 964, 662, 112, 455, 854, 641, 0, 463, 190, 455],
    [343, 324, 547, 321, 405, 709, 190, 126, 706, 578, 740, 300, 420, 279, 508, 696, 540, 575, 984, 420, 351, 463, 0, 660, 330],
    [312, 891, 1141, 389, 957, 143, 538, 637, 1292, 336, 278, 642, 515, 892, 331, 981, 883, 176, 444, 1036, 713, 190, 660, 0, 695],
    [396, 672, 867, 271, 747, 701, 149, 363, 951, 949, 690, 640, 529, 477, 458, 1112, 350, 568, 951, 608, 691, 455, 330, 695, 0]];


const numAnts = 2400;
// альфа - приоритетность путей с феромонами, чем выше показатель - тем выше шанс, что муравей выберет путь с бОльшей концентрацией ферамона, позволяет отточить самый лучший маршрут, но приводит к "консерватизации"
const alpha = 9.0;
// бета в формуле - это уровень лени муравья, чем выше значение - тем выше вероятность, что муравей выберет ближайший город, хорошо, при улучшении результатов, и плохо, что приводит к "консерватизации"
const beta = 6.0;
// скорость испарения феромонов, по сути скорость исчезновения феромонов
const evaporationRate = 0.2;
const numIterations = 400;

const aco = new AntColonyOptimization(distances, numAnts, alpha, beta, evaporationRate);
const start = performance.now();
aco.run(numIterations);
const end = performance.now();
console.log(end - start);
