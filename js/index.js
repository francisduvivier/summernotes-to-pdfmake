//sourceData - data.js file
//logoURI - data.js file
var dpi = 72;
$(document).ready(function() {
	pdfMake.fonts = {
	    // Default font should still be available
	    Roboto: {
	        normal: 'Roboto-Regular.ttf',
	        bold: 'Roboto-Medium.ttf',
	        italics: 'Roboto-Italic.ttf',
	        bolditalics: 'Roboto-Italic.ttf'
	    },
	    // Make sure you define all 4 components - normal, bold, italics, bolditalics - (even if they all point to the same font file)
	    BlackPen: {
	        normal: 'Black Pen.ttf',
	        bold: 'Black Pen.ttf',
	        italics: 'Black Pen.ttf',
	        bolditalics: 'Black Pen.ttf'
	    }
	};
	var section = {
		prompt: {
			to: "",
			atn: "",
			date: "",
			email: "",
			sheet: "",
			cell: "",
			office: "",
			address: ""
		}
	}
	
	var previewImage = false;
	// Get the custom-section clone first
	var customSectionTemplate = $(".custom-section-wrapper").clone().wrap("<div>").parent().html();
	// summernote
	$('.summernote').summernote({
		height: 200,
	  	toolbar: [
			['fontname', ['fontname']],
			['fontsize', ['fontsize']],
			['style', ['clear']],
			['para', ['ul', 'ol', 'paragraph']],
			['style', ['style', 'bold', 'italic', 'underline']],			
			['font', ['strikethrough', 'superscript', 'subscript']],			
			['color', ['color']],			
			['height', ['height']],				
			['insert', ['link', 'hr']],
			['view', ['fullscreen', 'codeview','undo','redo']],
			['help', ['help']]
	  	]
	});
	// datepicker
	$("[prop=date][section=prompt]").datepicker();
	
	$(document).on("click", "#generate-pdf", function() {
		previewImage = $("#preview-images").is(":checked");
		generateDefinition();
		generateToIframe();
	});
	$(document).on("click", "#open-pdf", function() {
		previewImage = true;
		generateDefinition();
		var fileName = [
			"Proposal # ",
			$('[prop="sheet"]').val(),
			", " + $('[prop="to"]').val(),
			"- " + $('#project-name').val(),
			" - " + $('[prop="date"]').val(),
		].join("");
		pdfMake.createPdf(window.docDefinition).download(fileName);
		previewImage = $("#preview-images").is(":checked");
	});
	// Create more custom section
	$(document).on("click", "#new-section", function() {
		var $last = $(".custom-section-wrapper").first();
		var $section = $(customSectionTemplate);
		var totalSection = $(".custom-section-wrapper.scope").length + 1;

		var rand = new Date().getTime();
		$section.find(".panel-heading").attr({
			href: "#custom-section"+rand
		});
		$section.find(".panel-body").attr({
			id: "custom-section"+rand
		});
		$section.find(".custom-section-count").html("#"+totalSection);
		// Click to expand it
		$section.find(".panel-body").removeClass("collapse");

		$last.after($section);

	});
	// Listen on type selection
	$(document).on("change", "select.type-select", function() {
		var parent = $(this).closest(".panel-body");
		var category = parent.attr("id");
		category = category.split("-")[0];
		var typeValue = $(this).val();
		
		// Generate html for selected type under category
		generateItemsTemplate(category, typeValue);
	});
	generateItemsTemplate("exclusions", $("#exclusions-section .type-select").val());
	generateItemsTemplate("clarifications", $("#clarifications-section .type-select").val());
	generateItemsTemplate("conditions", $("#conditions-section .type-select").val());

	function generateToIframe() {
		var pdfDocGenerator = pdfMake.createPdf(window.docDefinition);
		pdfDocGenerator.getDataUrl((dataUrl) => {
		    $("#target-url").attr({
		    	src: dataUrl
		    });
		});
	}

	function generateDefinition() {
		window.docDefinition = {
			pageSize: { width: 8.5 * dpi, height: 11 * dpi },
			pageMargins: [ 0.2 * dpi, 2.325 * dpi, 0.2 * dpi, 0.3 * dpi ], //[l, t, r, b]
			content: [
				// PROMPT SECTION
				{
					style: 'promptTable',
					layout: 'noBorders',
					margin: [ 0, -0.0 * dpi, 0, 0 * dpi],
					table: {
						widths: [7/3 * dpi, 7/3 * dpi, 7/3 * dpi],
						body: generatePrompt('promptTableText') // generate PROMPTS section
					},
					footerMode: 'after'
				},

				// PROJECT NAME SECTION
				{
					canvas: [{ type: 'line', x1: 0, y1: 0, x2: (9.5-1.4) * dpi, y2: 0, lineWidth: 2.5, lineColor: "#999999" },
							{ type: 'line', x1: 0, y1: 2.5, x2: (9.5-1.4) * dpi, y2: 2.5, lineWidth: 2.5, lineColor: "#323232" }]
				},
				{
					style: 'projectName',
					margin: [ 0 * dpi, 0.055 * dpi, 0 * dpi, 0 * dpi ],
					text: "Project Name:" + (" " + $("#project-name").val() + " ").toUpperCase()
				},
				{
					canvas: [{ type: 'line', x1: 0, y1: 5, x2: (9.5-1.4) * dpi, y2: 5, lineWidth: 2.5, lineColor: "#999999" },
							{ type: 'line', x1: 0, y1: 7.5, x2: (9.5-1.4) * dpi, y2: 7.5, lineWidth: 2.5, lineColor: "#323232" }]
				},

				// CUSTOM SECTION
				generateCustomItems(),

				// QUOTE/PRICE SECTION
				generateQuoteTable(),


				// EXCLUSIONS SECTION
				{
					margin: [ 0 * dpi, 0 * dpi, 0 * dpi, 0 * dpi ],
					text: 'Standard Exclusions:',
					style: 'exclusionsTitle'
				},
				{
					margin: [ 0.375 * dpi, 0.075 * dpi, 0 * dpi, 0 * dpi ], //[l, t, r, b]
					columns: generateListItems('exclusions', 2, 'exclusionsText')
				},

				// CLARIFICATIONS SECTION
				generateListItems('clarifications', 1, 'clarificationsText', {
					margin: [ 0 * dpi, 0.375 * dpi, 0 * dpi, 0 * dpi ],
					text: 'Standard Clarifications:',
					style: 'clarificationsTitle'
				}),

				// CONDITION SECTION
				{
					margin: [ 0 * dpi, 0.375 * dpi, 0 * dpi, 0.075 * dpi ],
					text: 'O&M Industries Standard Terms & Conditions',
					style: 'conditionsTitle'
				},
				{
					margin: [ 0.375 * dpi, 0.075 * dpi, 0 * dpi, 0 * dpi ], //[l, t, r, b]
					columns: generateListItems('conditions', 1, 'conditionsText')
				},
			],
			styles: {
				header: {
					fontSize: 25,
					bold: true,
					alignment: 'center'
				},
				headerText: {
					fontSize: 10.5,
					bold: true,
					alignment: 'center',
					margin: [ 0 * dpi, 0.03 * dpi, 0 * dpi, 0 * dpi ], //[l, t, r, b]
				},
				promptTable: {
					border: [false, false, false, false],
					alignment: 'center'
				},
				promptTableText: {
					alignment: 'left'
				},
				projectName: {
					bold: true,
					alignment: 'center'
				},
				customTitle: {
					bold: true,
					decoration: 'underline'
				},
				customText: {
				 'list-type':'none'
				 
				},
				exclusionsTitle: {
					bold: true,
					decoration: 'underline',
				},
				exclusionsText: {
				},
				clarificationsTitle: {
					bold: true,
					decoration: 'underline',
				},
				clarificationsText: {
				},
				conditionsTitle: {
					bold: true,
					decoration: 'underline',
					alignment: 'center'
				},
				conditionsText: {
					fontSize: 9
				},
			}
		}
		
		window.docDefinition.header = function(currentPage){
			var header = {
		        margin: [ 0.2 * dpi, 0.9 * dpi, 0.2 * dpi, 0 * dpi ], //[l, t, r, b]
		        columns: [
		            [
					// 	{
					// 	text: "_______________              CA Lic. #284930       OR Lic. #121420       NV Lic. #0055294       DIR#1000000183",
					// 	style: 'headerText'
					// }, 
					{
						canvas: [{ type: 'line', x1: 0, y1: 2, x2: (9.5-1.4) * dpi, y2: 2, lineWidth: 1.2, lineColor: "#999999" },
								{ type: 'line', x1: 0, y1: 3.3, x2: (9.5-1.4) * dpi, y2: 3.3, lineWidth: 1.5, lineColor: "#323232" }]
					}, 
					// {
					// 	text: "5901 Ericson Way, Arcata, CA. 95521 • 707-822-8995",
					// 	style: 'headerText'
					// },
					 previewImage ? {
		                image: logoURI1,
		               	// width: 0//1.55 * dpi
		               	fit: [105,105],
						absolutePosition: {x: 0.72 * dpi, y: 0.58 * dpi}
		            } : ""
					],
		            
		        ]
		    }
			var dd = window.docDefinition;
			var content = dd.content;

			var quoteIndex = -1;
			var quoteSection = content.filter(function(obj, index) {
				if (obj.hasOwnProperty("isQuoteSection")) {
					quoteIndex = index;
				}
			});
			var position = docDefinition.content[quoteIndex].positions;
			var quotePageNumber = position[position.length-1].pageNumber;

			if (currentPage <= 1) {				
				var header = {
					margin: [ 0.2 * dpi, 0.7 * dpi, 0.2 * dpi, 0 * dpi ], //[l, t, r, b]
					columns: [
						[{
							text: "_______________              CA Lic. #284930       OR Lic. #121420       NV Lic. #0055294       DIR#1000000183",
							style: 'headerText'
						}, {
							canvas: [{ type: 'line', x1: 0, y1: 2, x2: (9.5-1.4) * dpi, y2: 2, lineWidth: 1.2, lineColor: "#999999" },
									{ type: 'line', x1: 0, y1: 3.3, x2: (9.5-1.4) * dpi, y2: 3.3, lineWidth: 1.5, lineColor: "#323232" }]
						}, {
							text: "5901 Ericson Way, Arcata, CA. 95521 • 707-822-8995",
							style: 'headerText'
						}, previewImage ? {
							image: logoURI,
							   // width: 0//1.55 * dpi
							   fit: [105,105],
							absolutePosition: {x: 0.72 * dpi, y: 0.98 * dpi}
						} : ""
						],
						
					]
				}

				header.columns[0].unshift({
					text: "PROPOSAL",
					style: 'header'
				});
			} else {
				header.columns[0].unshift({
					text: "PROPOSAL",
					fontSize: 15,
					color: "#fff"
				});

				var headerImage = header.columns[0][header.columns[0].length - 1];
				if (typeof headerImage == "object") {
					headerImage.absolutePosition = {x: 0.72 * dpi, y: 0.83 * dpi}
				}
			}

			return header;
		}
	}

	function generatePrompt(style) {
		var promptSection = $("[section=prompt]");
		promptSection.each(function() {
			var prop = $(this).attr("prop");
			section.prompt[prop] = $(this).val();
		});

		var prompt = [];
		var firstRow = []; // to - atn - date
		if (section.prompt.to) {
			firstRow.push({text: '' + section.prompt.to, style: style});
		} else {
			firstRow.push("");
		}
		if (section.prompt.atn) {
			firstRow.push({text: 'Atn: ' + section.prompt.atn, style: style});
		} else {
			firstRow.push("");
		}
		if (section.prompt.date) {
			firstRow.push({text: '' + section.prompt.date, style: style});
		} else {
			firstRow.push("");
		}
		if (firstRow.join("") != "") {
			prompt.push(firstRow);
		}

		var secondRow = [];
		if (section.prompt.email) {
			secondRow.push({text: '' + section.prompt.email, style: style});
		} else {
			secondRow.push("");
		}
		secondRow.push("");
		if (section.prompt.sheet) {
			secondRow.push({text: 'Estimate Sheet #: ' + section.prompt.sheet, style: style});
		} else {
			secondRow.push("");
		}
		if (secondRow.join("") != "") {
			prompt.push(secondRow);
		}

		var thirdRow = [];
		if (section.prompt.office) {
			var office = section.prompt.office;
			office = formatPhoneNumber(office);
			thirdRow.push({text: "Office: " + office, style: style});
		} else {
			thirdRow.push("");
		}
		if (section.prompt.cell) {
			var cell = section.prompt.cell;
			cell = formatPhoneNumber(cell);
			thirdRow.push({text: "Cell: " + cell, style: style});
		} else {
			thirdRow.push("");
		}
		thirdRow.push("");
		if (thirdRow.join("") != "") {
			prompt.push(thirdRow);
		}

		var fourthRow = [];
		if (section.prompt.address) {
			fourthRow.push({text: '' + section.prompt.address, style: style});
		} else {
			fourthRow.push("");
		}
		fourthRow.push("");
		fourthRow.push("");
		if (fourthRow.join("") != "") {
			prompt.push(fourthRow);
		}

		if (prompt.length > 0) {
			return prompt;
		} else {
			return [[]];
		}
	}

	function generateListItems(category, totalColumns, style, titleItem) {
		var $parent = $("#"+ category +"-section");
		var $checkboxes = $parent.find('input[type="checkbox"]');
		var listStyle = $parent.find('select.list-style-select').val();
		var subStyle = $parent.find('select.sub-style-select').val();

		var sourceDataList = sourceData[category];
		var selectedListIndex = [];

		$checkboxes.each(function(i, el) {
			if ($(this).is(":checked")) {
				selectedListIndex.push($(this).val());
			}
		}); 

		var columns = generatePdfItems(sourceDataList, selectedListIndex, listStyle, subStyle, totalColumns, style);

		var result = columns;
		if (titleItem) {
			if ($checkboxes.length != 0) {
				result = [
					titleItem, 
					{
						margin: [ 0.375 * dpi, 0.075 * dpi, 0 * dpi, 0 * dpi ], //[l, t, r, b]
						columns: columns
					}];
			}
		} 

		return result;
	}

	// Common function used for pre-defined list and custom list
	// selectedListIndex should be null on custom list item
	function getListStyle(listStyle) {
		var listCategory = "ul";

		if (listStyle.indexOf("li.") != -1) {
			listCategory = "li";
		}

		return listCategory;
	}
	function generatePdfItems(source, selectedListIndex, listStyle, subStyle, totalColumns, style) {
		// PDF template with columns and 2 list
		var listCategory = getListStyle(listStyle);

		var selectedListStyle = listStyle.split(listCategory+".")[1]; // in ul.number...

		// if selectedListIndex is null, generate a replace that has all the index
		if (!selectedListIndex) {
			selectedListIndex = source.map(function(a, i) {return i;});
		}

		selectedListIndex = selectedListIndex.reverse();

		var columns = [{}]; // 2 col as default
		columns[0][listCategory] = [];
		columns[0].type = selectedListStyle;

		if (totalColumns == 2) {
			columns.push({}); 
			columns[1][listCategory] = [];
			columns[1].type = selectedListStyle;
		}
		var colCount = Math.round(selectedListIndex.length / totalColumns);

		for (var i = 0; i < selectedListIndex.length; i++) {
			var columnIndex = 0;
			if (i < colCount && totalColumns > 1) {
				columnIndex = 1;
				columns[columnIndex].start = selectedListIndex.length%2 == 0 ? colCount+1 : colCount; // start: 'number' for order list only
			}

			var dataItem = source[selectedListIndex[i]]; // selectedListIndex stores the index of the data item in sourceData
			var itemText = {
				text: dataItem.title || dataItem.text,
				style: [style],
				listType: dataItem.listType
			}

			// If there is title, place the text content under a custom list style
			if (dataItem.title) {
				itemText.decoration = 'underline'; // Condition item title has underline
				//itemText.listType = 'none'; // Number did not follow the size, set it own number
				// Make condition item become array to display multiple lines
				itemText = [itemText];

				var itemContent = dataItem.text;
				var itemContent = {
					margin: [ -0.275 * dpi, 0 * dpi, 0 * dpi, 0 * dpi ], //[l, t, r, b] for CONDITION text, has negative margin on content
					text: dataItem.text,
					style: [style],
					listType: 'none'
				}

				itemText.push(itemContent);
			}

			// If there are sub items under the item
			// TODO: Make it recursive
			if (dataItem.sub_items) {
				var subCategory = getListStyle(subStyle);

				var selectedListStyle = subStyle.split(subCategory+".")[1]; // in ul.number...
				// Make condition item become array to display multiple lines
				itemText = [itemText];
				var parentItem = {};
				parentItem.type = selectedListStyle;

				for (var j = 0; j < dataItem.sub_items.length; j++) {
					var subText = {
						text: dataItem.sub_items[j].text, // make sure it has item
						style: [style]
					}

					if (!parentItem[subCategory]) {
						parentItem[subCategory] = [];
					}
					parentItem[subCategory].push(subText);
				}
				itemText.push(parentItem);
			}

			var table = {
				listType: itemText.length ? itemText[0].listType : itemText.listType,
				layout: 'noBorders',
				table: {
					headerRows: 1, 
    				keepWithHeaderRows: true,
					body: [
						[itemText]
					]
				}
			}
			columns[columnIndex][listCategory].unshift(table);
		}

		return columns;
	}

	function generateCustomItems() {
		var $customSection = $(".custom-section-wrapper");
		var pdfTemplate = [];

		$customSection.each(function(i, el) {
			var $parent = $(this);
			var defaultColumn = 1;
			var title = $parent.find(".custom-section-title").val();
			var content = $parent.find(".summernote").summernote('code');
			var listStyle = $parent.find(".list-style-select").val();
			var subStyle = $parent.find(".sub-style-select").val();
			var isSpecific = $parent.find(".section-included").length > 0;
			if (isSpecific) {
				var isIncluded = $parent.find(".section-included").is(":checked");
				defaultColumn = 2;
			}

			if (isSpecific && !isIncluded) {
				return;
			}

			// Convert the content into json, to process as list item
			var contentJSON = htmlToPdfService.convertHtml(content);
			console.log(contentJSON);

			// Process when title and content has provided
			if (title && $(content).text()) {
			    console.log(title);
			    if(title =="SCOPE"){
			        var titleObject = {
					margin: [ 0 * dpi, 0.1 * dpi, 0 * dpi, 0.1 * dpi ],
					text: title,
					style: 'customTitle'
				};
				var contentObject = {
					margin: [ 0.375 * dpi, 0.1 * dpi, 0 * dpi, 0.125 * dpi ],
					columns: contentJSON,
				};
				// pdfTemplate.push(titleObject);
				pdfTemplate.push(contentObject);
			    }
			    else{
				var titleObject = {
					margin: [ 0 * dpi, 0.1 * dpi, 0 * dpi, 0.1 * dpi ],
					text: title,
					style: 'customTitle'
				};
				var contentObject = {
					margin: [ 0.375 * dpi, 0.1 * dpi, 0 * dpi, 0.125 * dpi ],
					columns: contentJSON 
				};
				pdfTemplate.push(titleObject);
				pdfTemplate.push(contentObject);
			        
			    }
			}
		});

		return pdfTemplate;
	}

	// Process to convert ul li markup into json, identical structure as data.js
	function list2json(markup) {
		var $markup = $("<div>"+markup+"</div>");
		// remove <br> <hr>
		$markup.find("br, hr").remove();

		function FetchChild(el) {
			var ul = el ? $(el) : $markup;
		    var data = [];
		    ul.find("> li").each(function() {
		        data.push(buildJSON($(this)));
		    });

		    return data;
		}

		function buildJSON($li) {
		    var subObj = {
		        "text": $li.contents().eq(0).text().trim()
		    };
		    $li.children('ul').children().each(function() {
		        if (!subObj.sub_items) {
		            subObj.sub_items = [];
		        }
		        subObj.sub_items.push(buildJSON($(this)));
		    });
		    return subObj;
		}

		var result = FetchChild();

		// If result empty, try splitting using <p>
		if (!result.length) {
			$markup.find("> ul, > p").each(function() {

 				var subObj = {};
				if ($(this).is("p")) {
					subObj = {
				        "text": $(this).text().trim()
				    };

				    if (!$(this).text()) {
						subObj = {text: ' ', listType: 'none'};
					}

				    result.push(subObj);
				} else if ($(this).is("ul")) {
					if (!result[result.length - 1]) {
						result.push({text: ""});
					}
					subObj = result[result.length - 1];
					subObj.sub_items = FetchChild($(this));
				}
			});
		}

		return result;
	}

	function generateQuoteTable() {
		var $parent = $("#quote-section");

		var includeText = [];
		var taxIncluded = $parent.find(".tax-included").is(":checked");
		if (taxIncluded) {
			includeText.push("Use Tax Included");
		}

		var saleTaxIncluded = $parent.find(".sale-tax-included").is(":checked");
		includeText.push(saleTaxIncluded ? "Sales/Use Tax Included" : "Plus Applicable State and Local Tax");

		var freightIncluded = $parent.find(".freight-included").is(":checked");
		if (freightIncluded) {
			includeText.push("Freight Included");
		} else {
			includeText.push("Freight Not Included");
		}

		includeText = includeText.length > 1 ? includeText.join(" - ") : includeText.join("");

		var totalPrice = $parent.find(".total-price").val();
		var totalPriceDefault = $parent.find(".total-price").attr("default");		
		var totalPriceToggle = $parent.find(".total-price-toggle").is(":checked");

		var priceValue = $parent.find(".price-value").val();
		priceValue = parseFloat(priceValue) ? "$"+numberWithCommas(parseFloat(priceValue).toFixed(2)) : "$0.00";
		var priceValueToggle = $parent.find(".price-value-toggle").is(":checked");

		var asPerQuote = [];
		if (totalPriceToggle) {asPerQuote.push(totalPrice || totalPriceDefault);}
		if (priceValueToggle) {asPerQuote.push(priceValue);}
		asPerQuote = asPerQuote.join("    ");

		var netAri = $parent.find(".net-ari").val() || 30;
		var netAriToggle = $parent.find(".net-ari-toggle").is(":checked");
		var percentDown = $parent.find(".percent-down").val();
		var percentDownToggle = $parent.find(".percent-down-toggle").is(":checked");
		var progressPayment = $parent.find(".progress-payment").val(); 
		var progressPaymentToggle = $parent.find(".progress-payment-toggle").is(":checked");
		var monthlyToggle = $parent.find(".monthly-toggle").is(":checked");

		var projectManger = $parent.find(".project-manager").val();

		var customTerms = $parent.find(".summernote").summernote('code');
		var termsJSON = list2json(customTerms);

		var tablePdf = {
			isQuoteSection: true,
			style: '',
			margin: [ 0 * dpi, 0 * dpi, 0 * dpi, 0 * dpi ], 
			table: {
				headerRows: 3, 
				keepWithHeaderRows: true,
				widths: ['50%', '50%'],
		    	alignment : 'center',
				body: [
					[   
						{
							stack: [{
									text: asPerQuote,
									alignment: 'center',
									margin: [ 0 * dpi, 0.005 * dpi, 0 * dpi, 0.025 * dpi ]
								}, 
								{
									text: includeText,
									alignment: 'center',
									margin: [ 0 * dpi, 0.025 * dpi, 0 * dpi, 0.015 * dpi ]
								}
							],
							border: [false, false, false, false],
							colSpan: 2
						}, 
						""
					],
					[
						{
							colSpan: 2, 
							text: [{
								text: '***MATERIAL COST SUBJECT TO CHANGES IN MARKET PRICE AND MATERIAL AVAILABILITY***',
								alignment: 'center'
							}], 
							color: 'red', 
							fontSize: 11,
							aligment: 'center',
							margin: [ 0 * dpi, 0.015 * dpi, 0 * dpi, 0.025 * dpi ],
							border: [false, false, false, false] //[l, t, r, b]
						},
						''
					],
					[
						{
							stack: [{
								text: 'Acceptance of proposal -The proposal as written, including O&M industries standard terms and conditions, are hereby accepted and you are authorized to do the work as specified. Should buyer default in making any payment required here under, and seller institutes legal proceedings, buyer agrees to pay all costs of collection including reasonable attorney’s fees. ',
								alignment: 'left',
								fontSize: 9
							}, 
							{
								text: 'Interest on past due amounts will be charged at 1.5% per month on all past due amounts',
								alignment: 'center',
								margin: [ 0 * dpi, 0.075 * dpi, 0 * dpi, 0.075 * dpi ], //[l, t, r, b]
								fontSize: 9
							}],
							border: [false, true, true, false]
						},
						{
							stack: [{
								text: netAriToggle ? 'Payment Terms: Net '+netAri+' ARI' : "",
								alignment: 'center',
								//margin: [ 0 * dpi, 0.175 * dpi, 0 * dpi, 0.175 * dpi ], //[l, t, r, b]
								fontSize: 9
							},{
								text: percentDownToggle ? percentDown+'% down' : "",
								alignment: 'center',
								//margin: [ 0 * dpi, 0.175 * dpi, 0 * dpi, 0.175 * dpi ], //[l, t, r, b]
								fontSize: 9
							},
							progressPaymentToggle ? {
								text: 'Progress payments as follows ' + progressPayment ,
								alignment: 'center',
								// margin: [ 0 * dpi, 0.075 * dpi, 0 * dpi, 0.075 * dpi ], //[l, t, r, b]
								fontSize: 9
							} : "",

							generateCustomPayment(termsJSON, [ 0 * dpi, 0.0 * dpi, 0 * dpi, 0.0 * dpi ]),

							monthlyToggle ? {
								text: 'Monthly Progress Payments based on % complete including materials stored at job site or shop and fabrication complete but not yet shipped.',
								alignment: 'center',
								margin: [ 0 * dpi, 0.01 * dpi, 0 * dpi, 0.015 * dpi ], //[l, t, r, b]
								fontSize: 9
							} : "",

							],
							border: [false, true, false, false]
						}
					],
					[{
						stack: [{
							text: "Accepted by X_________________________Date:_______________",
							alignment: 'center',
							fontSize: 9,
							margin: [ 0 * dpi, 0.075 * dpi, 0 * dpi, 0.075 * dpi ], //[l, t, r, b]
						}, {
							text: "Print name:________________________________________________",
							alignment: 'center',
							fontSize: 9,
							margin: [ 0 * dpi, 0.255 * dpi, 0 * dpi, 0.075 * dpi ], //[l, t, r, b]
						}],
						border: [false, false, true, false]
					}, {
						stack: [
							projectManger ? [{
								alignment: 'center',
								text: [{
									text: "Authorized Signature: ",
									fontSize: 9,
								}, {
									text: "mmm",
									fontSize: 9,
									color: "#fff"
								}, {
									text: projectManger ,									
									font: "BlackPen",
									fontSize: 30
								}]
							}, {
								text: "_______________________",
								margin: [ 1.65 * dpi, -0.235 * dpi, 0 * dpi, 0.055 * dpi ],
							}] : {
								text: "Authorized Signature:__________________________",
								alignment: 'center',
								fontSize: 9,
								margin: [ 0 * dpi, 0.075 * dpi, 0 * dpi, 0.055 * dpi ], //[l, t, r, b]
							}, 
							projectManger ? [{
								text: [{
									text: 'Project Manager:                 ' + projectManger + '',
									alignment: 'center',
									fontSize: 9,
									margin: [ 0 * dpi, 0.055 * dpi, 0 * dpi, 0.075 * dpi ], //[l, t, r, b]
								}, {
									text: "mmmmm",
									fontSize: 9,
									color: "#fff"
								}]
							}, {
								text: "______________________",
								margin: [ 1.65 * dpi, -0.175 * dpi, 0 * dpi, 0.055 * dpi ],
							}] : "",{
								text: "Note: This proposal may be withdrawn by us if not accepted within 10 days.",
								alignment: 'center',
								fontSize: 9
						}],
						border: [false, false, false, false]
					}]
				]
				}
		}

		return tablePdf;
	}

	function generateCustomPayment(list, margin) {
		var terms = [];
		for (var i = 0; i < list.length; i++) {
			var object = {
				text: list[i].text,
				alignment: 'center',
				margin: margin,
				fontSize: 9,
			}
			terms.push(object);
		}

		return terms;
	}

	function generateItemsTemplate(category, type) {
		var listItem = sourceData[category];
		var $parent = $("#" + category + "-section").find(".items-choice");
		$parent.html("");

		var itemTemplate = $("#list-item-template").html();

		for (var i = 0; i < listItem.length; i++) {
			var itemType = listItem[i].type;
			if (itemType.indexOf(type) == -1) {
				continue;
			}

			var text = "";

			if (listItem[i].title) {
				text += "<strong>" + listItem[i].title + "</strong> <br> ";
			}
			text += listItem[i].text;

			var $item = $(itemTemplate);
			$item.find("input").after(text);
			$item.find("input").val(i);

			$parent.append($item);
		}

		if (!listItem.length) {
			$parent.html("-- No item --");
		}
	}

	function numberWithCommas(x) {
	    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
	}

	function formatPhoneNumber(text) {
		text = text.replace(/(\d{3})(\d{3})(\d{4})/, "($1)-$2-$3");
        return text;
	}
});
