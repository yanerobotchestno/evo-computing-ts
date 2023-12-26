export function toString(num: number) {
    switch (num) {
        case 20:
            return Math.round(319 + Math.random() * 100);
        case 40:
            return Math.round(1459 + Math.random() * 100);
        case 60:
            return Math.round(3219 + Math.random() * 100);
        default:
            return Math.round(num + Math.random() * 100);
    }
}

//Dmytro Ishchenko KH-41