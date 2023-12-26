
 export function f(x:number) {
    return x ^ 2;
}

 export function matyasFunction(x: number, y: number): number {
     return 0.26 * (x ** 2 + y ** 2) - 0.48 * x * y;
 }

 export function schaffer2(x: number, y: number): number {
     const fact1: number = Math.pow(Math.sin(x ** 2 - y ** 2), 2) - 0.5;
     const fact2: number = Math.pow(1 + 0.001 * (x ** 2 + y ** 2), 2);

     const result: number = 0.5 + fact1 / fact2;

     return result;
 }


 export function bukin6(x: number, y: number): number {
     const term1: number = 100 * Math.sqrt(Math.abs(y - 0.01 * x ** 2));
     const term2: number = 0.01 * Math.abs(x + 10);

     const result: number = term1 + term2;

     return result;
 }