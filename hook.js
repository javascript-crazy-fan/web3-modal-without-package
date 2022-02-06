"use strict";

const Web3Modal = window.Web3Modal.default;
const WalletConnectProvider = window.WalletConnectProvider.default;
const evmChains = window.evmChains;
let web3Modal
let provider;
let selectedAccount;


function init() {
	if (location.protocol !== 'https:') {
		const alert = document.querySelector("#alert-error-https");
		alert.style.display = "block";
		document.querySelector("#btn-connect").setAttribute("disabled", "disabled")
		return;
	}

	const providerOptions = {
		walletconnect: {
			package: WalletConnectProvider,
			options: {
				infuraId: "8043bb2cf99347b1bfadfb233c5325c0",
			}
		}
	};
	web3Modal = new Web3Modal({
		cacheProvider: false,
		providerOptions,
		disableInjectedProvider: false,
	});
}

async function fetchAccountData() {

	const web3 = new Web3(provider);
	const chainId = await web3.eth.getChainId();
	const chainData = evmChains.getChain(chainId);
	document.querySelector("#network-name").textContent = chainData.name;
	const accounts = await web3.eth.getAccounts();
	selectedAccount = accounts[0];
	document.querySelector("#selected-account").textContent = selectedAccount;
	const template = document.querySelector("#template-balance");
	const accountContainer = document.querySelector("#accounts");
	accountContainer.innerHTML = '';

	const rowResolvers = accounts.map(async (address) => {
		const balance = await web3.eth.getBalance(address);
		const ethBalance = web3.utils.fromWei(balance, "ether");
		const humanFriendlyBalance = parseFloat(ethBalance).toFixed(4);
		const clone = template.content.cloneNode(true);
		clone.querySelector(".address").textContent = address;
		clone.querySelector(".balance").textContent = humanFriendlyBalance;
		accountContainer.appendChild(clone);
	});
	await Promise.all(rowResolvers);

	document.querySelector("#prepare").style.display = "none";
	document.querySelector("#connected").style.display = "block";
}

async function refreshAccountData() {
	document.querySelector("#connected").style.display = "none";
	document.querySelector("#prepare").style.display = "block";
	document.querySelector("#btn-connect").setAttribute("disabled", "disabled")
	await fetchAccountData(provider);
	document.querySelector("#btn-connect").removeAttribute("disabled")
}

async function onConnect() {
	try {
		provider = await web3Modal.connect();
	} catch (e) {
		console.log("Could not get a wallet connection", e);
		return;
	}

	provider.on("accountsChanged", (accounts) => {
		fetchAccountData();
	});

	provider.on("chainChanged", (chainId) => {
		fetchAccountData();
	});

	// Subscribe to networkId change
	provider.on("networkChanged", (networkId) => {
		fetchAccountData();
	});

	await refreshAccountData();
}
async function onDisconnect() {

	console.log("Killing the wallet connection", provider);

	// TODO: Which providers have close method?
	if (provider.close) {
		await provider.close();
		await web3Modal.clearCachedProvider();
		provider = null;
	}

	selectedAccount = null;
	document.querySelector("#prepare").style.display = "block";
	document.querySelector("#connected").style.display = "none";
}

window.addEventListener('load', async () => {
	init();
	document.querySelector("#btn-connect").addEventListener("click", onConnect);
	document.querySelector("#btn-disconnect").addEventListener("click", onDisconnect);
});
