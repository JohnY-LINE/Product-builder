
class LottoGenerator extends HTMLElement {
    constructor() {
        super();
        const shadow = this.attachShadow({ mode: 'open' });

        const wrapper = document.createElement('div');
        wrapper.setAttribute('class', 'lotto-generator');

        const title = document.createElement('h1');
        title.textContent = 'Lotto Number Generator';

        const numbersContainer = document.createElement('div');
        numbersContainer.setAttribute('class', 'numbers');

        const button = document.createElement('button');
        button.textContent = 'Generate Numbers';

        const style = document.createElement('style');
        style.textContent = `
            .lotto-generator {
                background-color: var(--white);
                padding: 2rem;
                border-radius: var(--border-radius);
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                text-align: center;
            }
            h1 {
                color: var(--primary-color);
                margin-top: 0;
            }
            .numbers {
                display: flex;
                justify-content: center;
                gap: 1rem;
                margin: 2rem 0;
            }
            .number {
                width: 50px;
                height: 50px;
                border-radius: 50%;
                background-color: var(--primary-color);
                color: var(--white);
                display: flex;
                justify-content: center;
                align-items: center;
                font-size: 1.5rem;
                font-weight: bold;
            }
            button {
                background-color: var(--primary-color);
                color: var(--white);
                border: none;
                padding: 1rem 2rem;
                font-size: 1rem;
                border-radius: var(--border-radius);
                cursor: pointer;
                transition: background-color 0.3s ease;
            }
            button:hover {
                background-color: #357abd;
            }
        `;

        shadow.appendChild(style);
        shadow.appendChild(wrapper);
        wrapper.appendChild(title);
        wrapper.appendChild(numbersContainer);
        wrapper.appendChild(button);

        button.addEventListener('click', () => this.generateNumbers());
    }

    generateNumbers() {
        const numbersContainer = this.shadowRoot.querySelector('.numbers');
        numbersContainer.innerHTML = '';
        const numbers = new Set();
        while (numbers.size < 6) {
            numbers.add(Math.floor(Math.random() * 45) + 1);
        }

        for (const number of [...numbers].sort((a, b) => a - b)) {
            const numberElement = document.createElement('div');
            numberElement.setAttribute('class', 'number');
            numberElement.textContent = number;
            numbersContainer.appendChild(numberElement);
        }
    }
}

customElements.define('lotto-generator', LottoGenerator);
