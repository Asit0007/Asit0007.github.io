
// connect to Moralis server
const serverUrl = "https://kl2v128s0uzy.usemoralis.com:2053/server";
const appId = "mbH4DJOsRPhRJDz91bw549pyNCrN2IP3B55X1HJf";
Moralis.start({ serverUrl, appId });

//initializing moralis plugins
Moralis
    .initPlugins()
    .then(() => console.log('Plugins have been installed'));
// state space
const $tokenBalanceBody = document.querySelector(".js-token-balances");
const $selectedToken = document.querySelector('.js-from-token')
const $amountInput = document.querySelector('.js-from-amount');

//login and log out
async function login() {
    let user = Moralis.User.current();
    if (!user) {
      user = await Moralis.authenticate();
    }
    console.log("logged in user:", user);
    alert("Logged in");
    getStats();
}

//swap function
async function initSwapFom(event) {
    event.preventDefault();
    $selectedToken.innerText = event.target.dataset.symbol;
    $selectedToken.dataset.address = event.target.dataset.address;
    $selectedToken.dataset.decimals = event.target.dataset.decimals;
    $selectedToken.dataset.max = event.target.dataset.max;
    $amountInput.removeAttribute('disabled');
    $amountInput.value='';
    document.querySelector('.js-submit').removeAttribute('disabled');
    document.querySelector('.js-cancel').removeAttribute('disabled');
    document.querySelector('.js-quote-container').innerHTML = '';
}


// function to get token information
async function getStats() {
    let tokenValue=0;
    const balance = await Moralis.Web3API.account.getTokenBalances( {chain: "bsc"} );
    console.log(balance);
    $tokenBalanceBody.innerHTML = balance.map( (token, index) => `
        <tr class="table-value">
            <td class="col1-value"> ${index + 1}</td>
            <td class="col2-value"> ${token.symbol} </td>
            <td class="col3-value"> ${tokenValue = Moralis.Units.FromWei(token.balance, token.decimal)} </td>
            <td class="col4-value">
                <button 
                    class="js-swap"
                    data-address="${token.token_address}"
                    data-symbol="${token.symbol}"
                    data-decimals="${token.decimals}"
                    data-max="${tokenValue = Moralis.Units.FromWei(token.balance, token.decimals)}"
                >
                    Swap
                </button>
            </td>
        </tr>
    `).join('');

    // loop for listening to swap buttons
    for (let $btn of $tokenBalanceBody.querySelectorAll('.js-swap')) {
        $btn.addEventListener('click', initSwapFom);
    }
}



//logOut function
async function logOut() {
    await Moralis.User.logOut();
    console.log("logged out");
    alert("Logged out");
}

//buy crypto function
async function buyCrypto() {
    await Moralis.Plugins.fiat.buy();
}

document.querySelector('.btn-login').addEventListener('click', login);
document.querySelector('.btn-logout').addEventListener('click', logOut);
document.querySelector('.buy-crypto').addEventListener('click', buyCrypto);

//Quote Swap
async function formSubmitted(event) {
    event.preventDefault();
    const fromAmount = Number.parseFloat( $amountInput.value );
    const fromMaxValue = Number.parseFloat( $selectedToken.dataset.max );
    if ( Number.isNaN(fromAmount) || fromAmount > fromMaxValue) {
        //invalid input
        document.querySelector('.js-amount-error').innerText = 'Invalid Amount';
        return;
    }
    else {
        document.querySelector('.js-amount-error').innerText = ' ';
    }

    //submission for the quote
    
    const fromDecimals = $selectedToken.dataset.decimals;
    const fromTokenAddress = $selectedToken.dataset.address;
    
    const [toTokenAddress, toDecimals] = document.querySelector('[name="to-token"]').value.split('-');

    try {
        
    } catch (e) {

        const quote = await Moralis.Plugins.oneInch.quote({
            chain:'bsc', // The blockchain you want to use (eth/bsc/polygon)
            fromTokenAddress: fromTokenAddress , // The token you want to swap
            toTokenAddress: toTokenAddress, // The token you want to receive
            amount: Moralis.Units.Token(fromAmount, fromDecimals).toString(),
        });
        
        const toAmount = tokenValue(quote.toTokenAmount, toDecimals);
        document.querySelector('.js-quote-container').innerHTML = `
        <p>
            ${fromAmount} ${quote.fromToken.symbol} =
            ${toAmount} ${quote.toToken.symbol}
        </p>
        <p>
            Gas fee: ${quote.gasFee}
        </p>

        `;

        document.querySelector('.js-quote-container').innerHTML = `
        <p class="error"> The conversion didn't succeed. </p>
        `;
    }

}

//Quote Canceled
async function formCanceled(event) {
    event.preventDefault();
    document.querySelector('.js-submit').setAttribute('disabled', ' ' );
    document.querySelector('.js-cancel').setAttribute('disabled', ' ' );
    $amountInput.value='';
    $amountInput.setAttribute('disabled', ' ' );
    delete $selectedToken.dataset.address;
    delete $selectedToken.dataset.decimals;
    delete $selectedToken.dataset.max;
    document.querySelector('.js-quote-container').innerHTML = '';
    document.querySelector('.js-amount-error').innerText = ' ';
}

document.querySelector('.js-submit').addEventListener('click', formSubmitted );
document.querySelector('.js-cancel').addEventListener('click', formCanceled );

// api script for tokens fetching for the dropdown
async function getTop10Tokens() {
    try {

    
        const response = await fetch('https://api.coinpaprika.com/v1/coins/');
        const tokens = await response.json();

        return tokens
            .filter(token => token.rank >=1 && token.rank <= 100)
            .map(token => token.symbol);
    } catch(e) {
        console.log(`error: ${e}`);
    }
}
//Code in green below logs the top 10 coins from coinpaprika
// getTop10Tokens()
   // .then(console.log);

async function getTickerAddresses(tickerList) {
    try {

    const response = await fetch('https://api.1inch.exchange/v3.0/56/tokens/');
    const tokens = await response.json();
    const tokenList = Object.values(tokens.tokens);

    return tokenList.filter(token => tickerList.includes(token.symbol));
    } catch(e) {
        console.log(`error: ${e}`);
    }
    
}

// code for dropdown token list
function renderTokenDropdown(tokens) {
    const options = tokens.map(token => `
        <option value="${token.address}-${token.decimals}">
            ${token.name}
        </option>
    `    
    ).join('');
    document.querySelector('[name=to-token]').innerHTML = options;
}

//code in this block logs the coin present in binance smart chain from the top 10 coins in paprika
getTop10Tokens()
 
    //can also be written as ".then(tickerList => getTickerAddresses(tickerList))"
    .then(getTickerAddresses)
    //.then(renderForm);
    .then(renderTokenDropdown);
