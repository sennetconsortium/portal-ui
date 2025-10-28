function useScrollToAnchor(maxTries = 4, interval = 700) {
    let attempts = 0;
    if (typeof window !== 'undefined') {
        const intervalId = setInterval(() => {
            attempts++;
            const currentHash = window.location.hash.slice(1);
            if (currentHash !== '') {
                const element = document.getElementById(currentHash);
                if (element) {
                    element.scrollIntoView({behavior: 'smooth'});
                    // We will just attempt this multiple times so the page will scroll multiple times. Uncomment below
                    // to change this behavior:
                    // clearInterval(intervalId); // Stop the check once the element is found
                    // return;
                }

                if (attempts >= maxTries) {
                    console.error(`Element with ID '${currentHash}' not found after ${maxTries} tries.`);
                    clearInterval(intervalId); // Stop if the max tries are exceeded
                }
            }
        }, interval);
    }
}

export default useScrollToAnchor