# Project Blueprint

## Overview

This project is a simple, framework-less web application that serves as a lottery number generator. It is built using modern HTML, CSS, and JavaScript, following best practices for web development.

## Features

*   **Lotto Number Generation:** Generates a set of 6 unique random numbers between 1 and 45.
*   **Modern UI:** A clean and responsive user interface built with modern CSS, including a visually appealing design.
*   **Web Components:** The application will be structured using Web Components to encapsulate functionality and improve maintainability.

## Current Task: Create the Lotto Number Generator

### Plan

1.  **Update HTML (`index.html`):**
    *   Set the page title to "Lotto Number Generator".
    *   Create a main container for the application.
    *   Add a heading for the title.
    *   Add a container to display the generated lottery numbers.
    *   Add a button to trigger the number generation.
    *   Use a `<lotto-generator>` custom element to encapsulate the entire application.

2.  **Style the Application (`style.css`):**
    *   Apply a modern and clean design to the application.
    *   Use CSS variables for colors and spacing.
    *   Style the number balls with a background color and a border.
    *   Add a hover effect to the "Generate" button.
    *   Ensure the layout is responsive.

3.  **Implement the Logic (`main.js`):**
    *   Create a `LottoGenerator` class that extends `HTMLElement`.
    *   Use the Shadow DOM to encapsulate the component's HTML and CSS.
    *   Implement a method to generate 6 unique random numbers between 1 and 45.
    *   Add an event listener to the "Generate" button to call the number generation method.
    *   Display the generated numbers in the UI.
