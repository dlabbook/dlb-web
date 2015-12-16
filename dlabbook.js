$(function(){
    nameRegContractAddress = "0x06b179aabf198ced0f98c8ceca905a920a137ef4";
    contRegContractAddress = "0x17956ba5f4291844bc25aedb27e69bc11b5bda39";
    defaultAccount = "0xcd2a3d9f938e13cd947ec05abc7fe734df8dd826";
	
	/* 
//	buddies: (for approving change of address)
//		B1 adds address of buddies B2, B3, B4 and number N to the contract D1
//		if N of the buddies B2, ... BN approve, 
//			the original address is marked inactive 
//			and a new address is registered to that name
	
	input fields:
		select account (show address + potentially name that it is registered to)
		register account "
		create new account
//		unregister account (needs approval of owner or N buddies)
		
	on startup:
		check availability of IPFS (try publishing)
		check availability of geth (check if we have access to an unlocked account with some Ether)
		
	on publish:
		find username of address
//		encrypt content
		publish IPFS hash
		register IPFS hash as content of address
		
	publishing priorities
		connect to local geth and publish to pre-coded address and abi
		fallback 1: connect to publicly available geth (which is later exposed via API, not giving everyone full access)
		alternative 1: connect to some other geth node
//		alternative 2: call / deploy custom contract 
		
	*/
    // click on menu items
    $("#navPublish").click(function(event){
        $("#contentBrowse").hide();
        $("#contentSign").hide();
        $("#contentDebug").hide();
        $("#contentSettings").hide();
        $("#contentEdit").hide();
        $("#contentPublish").fadeIn(800);
    });

    $("#navBrowse").click(function(event){
        reloadOwnContent();
        reloadOtherContent();
        $("#contentPublish").hide();
        $("#contentSign").hide();
        $("#contentDebug").hide();
        $("#contentSettings").hide();
        $("#contentEdit").hide();
        $("#contentBrowse").fadeIn(800);
    });

    $("#navSign").click(function(event){
        $("#contentPublish").hide();
        $("#contentBrowse").hide();
        $("#contentDebug").hide();
        $("#contentSettings").hide();
        $("#contentEdit").hide();
        $("#contentSign").fadeIn(800);
    });

    $("#navDebug").click(function(event){
        $("#contentPublish").hide();
        $("#contentBrowse").hide();
        $("#contentSign").hide();
        $("#contentSettings").hide();
        $("#contentEdit").hide();
        $("#contentDebug").fadeIn(800);
    });

    $("#navSettings").click(function(event){
        $("#contentPublish").hide();
        $("#contentBrowse").hide();
        $("#contentSign").hide();
        $("#contentDebug").hide();
        $("#contentEdit").hide();
        $("#contentSettings").fadeIn(800);
    });

    $("#navEdit").click(function(event){
        $("#contentPublish").hide();
        $("#contentBrowse").hide();
        $("#contentSign").hide();
        $("#contentDebug").hide();
        $("#contentSettings").hide();
        $("#contentEdit").fadeIn(800);
    });

    // hide all content except for publish on start
    $("#contentPublish").hide();
    $("#contentBrowse").hide();
    $("#contentSign").hide();
    $("#contentDebug").hide();
    $("#contentSettings").hide();
    //$("#contentEdit").hide();
    
    $("#ipfsPublishInfo").hide();   // only visible once we publish something to IPFS
   
    // create web3 object if required
	if(typeof web3 === 'undefined')
	{
        info("creating web3...");
		updateGethAddress();

        // define address of the contract (e.g. copy from sandbox)
        //var address = "0xdf315f7485c3a86eb692487588735f224482abe3";
        
        // use json function header (defined above)
        //var contract = web3.eth.contract(abi);
        //instance = contract.at(address);


        // TODO: let user user choose to connect to which web3 provider to connect (sandbox or (local) other)
		// have "advanced" settings which can be opened and contain the solidity source code.
		// try to compile using the local solidity compiler. if this fails use byte code (which is also supplied via "advanced" settings)
		// if contract cannot be deployed (because, e.g. geth or the solidity compiler is not available),
		//      connect to to pre-shared contract address 
		//      (warning: this will only work in the main net and the sandbox if we deployed that contract on sandbox start-up)
		//      TODO (Andre): check how we can setup our own test net so we can kind of easily test
		//       |--> Raspberry Pi with IPFS+GETH setup --> done
		//                                      |--> couple bits still to do (DNS/Firewall/etc) --> open
		//                                      |--> divert traffic from IDE to external server --> open
		//                      |--> we can connect to the sandbox from remote therefore this shouldnt be necessary (for the hackaton)
		//                          but might be a nice test-setup in the long run
		
		if (!web3.isConnected())
		{
            error("Web3 could not connect to Ethereum node. Make sure you have geth running locally and start it with 'geth --rpc --rpccorsdomain '*' --rpcaddr 0.0.0.0'");
		}
		else
		{
            info("connected to web3");
		}
	}
	
	// check if IPFS is available (by attempting to write one byte to it)
	try
	{
	    // exposing ipfs on that server is a serious security vulnerability
	    // TODO: this will in the future be served via an intermediate web service
    	updateIpfsAddress();
    	var buf = new ipfs.Buffer(0);
    	ipfs.add(buf, function(err, res){
            if (err || !res)
            {
				error("ipfs error: " + err);
                // this is async, so we cannot throw the error as the catch block below is already done.
                // render error again

                error("Could not connect to IPFS node. Make sure <ul><li>you have IPFS running on your local machine, start it with 'ipfs daemon'</li><li>before you start the daemon, set the cors domain with 'ipfs config --json API.HTTPHeaders.Access-Control-Allow-Origin \"[\\\"*\\\"]\"'</li></ul></div>");
                return;
            }
            info("connected to local IPFS node");
    	})
	}
	catch (err)
	{
        error("Could not connect to IPFS node. Make sure <ul><li>you have IPFS running on your local machine, start it with 'ipfs daemon'</li><li>before you start the daemon, set the cors domain with 'ipfs config --json API.HTTPHeaders.Access-Control-Allow-Origin \"[\\\"*\\\"]\"'</li></ul></div>");
	}
	
    $("#buttonPublish").button().click(function(event){
        $("#debug").append(document.createTextNode("clicked buttonPublish"));
        
        // read username
        var username = $("#username").val();
        if (username.length < 5)
        {
            $(".container").prepend("<div class='alert alert-danger alert-dismissible' role='alert'role='alert'><button type='button' class='close' data-dismiss='alert' aria-label='Close'><span aria-hidden='true'>&times;</span></button><strong>Error!</strong>Username has to be at least 5 characters long.</div>");
        }
        else
        {
			// Ethereum currently not available (for debugging purposes)
            /*// check if username is already registered
            if (!instanceNameReg.IsRegistered(username))
            {
                $(".container").prepend("<div class='alert alert-info alert-dismissible role='alert'role='alert'><button type='button' class='close' data-dismiss='alert' aria-label='Close'><span aria-hidden='true'>&times;</span></button><strong>Info:</strong>User " + username + " has not been registered yet, we will do that now.</div>");
                instanceNameReg.Register(username);
            }
            else
                $(".container").prepend("<div class='alert alert-success alert-dismissible role='alert'role='alert'><button type='button' class='close' data-dismiss='alert' aria-label='Close'><span aria-hidden='true'>&times;</span></button><strong>Info:</strong>You are registered as " + username + ".</div>");
			*/
            $("#debug").append("<br />");
            $("#debug").append($("#dataToPublish").val());
            
            // publish data to IPFS
        	updateIpfsAddress();
        	var buf = new ipfs.Buffer($("#dataToPublish").val());
        	ipfs.add(buf, function(err, res){
        	    // note: this function is executed asynchronously
        	    // i.e. the content of hash will most likely not be available yet outside of this function (synchronous code)
                if (err || !res) return console.log(err)
        	    var hash = res.Hash;
            	$("#ipfsPublishInfo").html("IPFS address (hash) of the data: <a href='https://gateway.ipfs.io/ipfs/" + hash + "'>" + hash + "</a>");
            	$("#ipfsPublishInfo").fadeIn(1000);
            	
            	// publish to Ethereum
            	//instanceContReg.registerContent(hash);
        	});
        }
    });
    
	$("#updateGethAddress").click(function(event){
		updateGethAddress();
	});
	$("#updateIpfsAddress").click(function(event){
		updateIpfsAddress();
	});
	
	$("#reloadOwnContent").click(function(event){
		reloadOwnContent();
	})
	$("#reloadOtherContent").click(function(event){
		reloadOwnContent();
	})
	
	$("#buttonCompile").click(function(event){
		var source = editor.getSession().getValue();
		try
		{
			compiled = web3.eth.compile.solidity(source);

			for (var contractName in compiled)
			{	// looping over all contracts (we might have more than one contract in code base)
				info("found contract: " + contractName);
				contractJson = eval("compiled." + contractName);

				// todo:
				//		do not overwrite but append
				//		dynamically create multi-contract deploy
				
				// implementation:
				//		write abi and code into array of objects (abi + code pair)
				//		dynamically create elements into which abis + codes are written
				//		on click "deploy", deploy all contracts
				//		dynamically create elements into which address is written
				abi = contractJson.info.abiDefinition;
				evmCode = contractJson.code;
				$("#compiledAbi").text(JSON.stringify(abi));
				$("#compiledCode").text(evmCode);
			}
		}
		catch (e)
		{
			error("Compile error: " + e);
		}
	})
	
	$("#buttonDeploy").click(function(event){
		var primaryAddress = web3.eth.accounts[0];
		// todo: make sure that abi is defined
		var MyContract = web3.eth.contract(abi);
		contract = MyContract.new({from: primaryAddress, data: evmCode})
		$("#contractAddress").text("[waiting for contract to be mined...]");
	})
	
	editor = ace.edit("editor");
    editor.setTheme("ace/theme/twilight");
    editor.session.setMode("ace/mode/javascript");
	editor.getSession().setUseWorker(false);	// disable syntax checker since we just use the javascript version which does not know contracts and other solidity-only features
	
	setInterval(updateLastBlockCounter, 2000);
});

function updateLastBlockCounter()
{
	try
	{
		var blkNo = web3.eth.blockNumber;
		$("#lastBlockNumber").text(blkNo);
		var latestBlk = web3.eth.getBlock("latest")
		var blkTime = latestBlk.timestamp - web3.eth.getBlock(latestBlk.number - 1).timestamp;
		$("#lastBlockTime").text(blkTime);
		$("#lastBlockTx").text(latestBlk.transactions.length);
		$("#pendingTx").text(web3.eth.getBlock("pending", true).transactions.length);
		$("#hashRate").text(web3.eth.hashrate);
		if (typeof contract === 'undefined')
			$("#contractAddress").text("[contract not deployed]");
		else
			$("#contractAddress").text(contract.address);
	}
	catch (e)
	{
		$("#lastBlockNumber").text("error: " + e);
	}
}

function reloadOwnContent()
{
    console.log("reloading own content:")
    var target = $("#ownContentBrowse");
    reloadContentFromAddress(target, defaultAccount);
}

function reloadOtherContent()
{
    var adr = $("#otherAddressBrowse").val()
    var target = $("#otherContentBrowse");
    reloadContentFromAddress(target, adr);
}

function reloadContentFromAddress(target, address)
{
    var contCount = instanceContReg.getNumberOfEntries(address).c[0];
    target.empty();
    target.append(contCount + " entries:<br /><br />");
    for (c = 0; c < contCount; c++)
    {
        var time = instanceContReg.getContentItemTime(address, c).c[0];
        var myDate = new Date(1000*time);
        var date = myDate.toString()
        var ipfsHash = instanceContReg.getContentItemIpfsAddress(address, c);
        target.append(date + ": <a href='https://gateway.ipfs.io/ipfs/" + ipfsHash + "'>" + ipfsHash + "</a><br />");
    }
}

function updateGethAddress()
{
    var gethAddress = $("#gethAddress").val();
    web3 = new Web3(new Web3.providers.HttpProvider(gethAddress));
	info("set geth node address to: " + gethAddress);
	//console.log("Found the following accounts: " + web3.eth.accounts);
	//$("#gethDebug").append("Found the following accounts: " + web3.eth.accounts);
	try
	{
		info("latest block number: " + web3.eth.blockNumber);
		
		//web3.eth.defaultAccount = defaultAccount;
		//instanceContReg = web3.eth.contract(contRegAbi).at(contRegContractAddress);
		//instanceNameReg = web3.eth.contract(nameRegAbi).at(nameRegContractAddress);
	}
	catch (e)
	{
		error(e);
	}
}

function updateIpfsAddress()
{
    var ipfsAddress = $("#ipfsAddress").val();
	ipfs = ipfsAPI(ipfsAddress);
    info("Set ipfs node address to: " + ipfsAddress);
}

function error(msg)
{	// displays an error message in browser console, as bootstrap error message and in debug tab
	console.log("Error: " + msg)
	$(".container").prepend("<div class='alert alert-danger alert-dismissible' role='alert'><button type='button' class='close' data-dismiss='alert' aria-label='Close'><span aria-hidden='true'>&times;</span></button><strong>Error!</strong><br />" + msg + "</div>");
	$("#debug").append(document.createTextNode("Error: " + msg));
	$("#debug").append("<br />");
}

function info(msg)
{	// displays an info message in browser console and in debug tab
	console.log("Info: " + msg)
	
	// todo: we might want to pop up if we enable debug mode or increased verbosity
			// but then it should be an info and not alert class
			
	$(".container").prepend("<div class='alert alert-danger alert-dismissible' role='alert'><button type='button' class='close' data-dismiss='alert' aria-label='Close'><span aria-hidden='true'>&times;</span></button><strong>Info:</strong><br />" + msg + "</div>");
	$("#debug").append(document.createTextNode("Info: " + msg));
	$("#debug").append("<br />");
}
