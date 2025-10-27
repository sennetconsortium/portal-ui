function useScrollToAnchor(maxTries = 4, interval = 500) {
    let attempts = 0;
    if (typeof window !== 'undefined') {
        const intervalId = setInterval(() => {
            attempts++;
            const currentHash = window.location.hash.slice(1);
            const element = document.getElementById(currentHash);
            console.log(attempts)
            if (element) {
                element.scrollIntoView({behavior: 'smooth'});
                clearInterval(intervalId); // Stop the check once the element is found
                return;
            }

            if (attempts >= maxTries) {
                console.error(`Element with ID '${currentHash}' not found after ${maxTries} tries.`);
                clearInterval(intervalId); // Stop if the max tries are exceeded
            }
        }, interval);
    }
}

export default useScrollToAnchor