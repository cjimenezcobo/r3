import MyBuilderCaption       from './builderCaption.js';
import MyBuilderIconInput     from './builderIconInput.js';
import MyBuilderFormFunctions from './builderFormFunctions.js';
import MyBuilderFormStates    from './builderFormStates.js';
import MyBuilderQuery         from './builderQuery.js';
import MyBuilderFields        from './builderFields.js';
import {getNilUuid}           from '../shared/generic.js';
import {
	getIndexAttributeId,
	isAttributeRelationship,
	isAttributeRelationshipN1
} from '../shared/attribute.js';
import {
	getDataFields,
	getFormRoute
} from '../shared/form.js';
import {
	getJoinsIndexMap,
	getQueryTemplate
} from '../shared/query.js';
export {MyBuilderForm as default};

let MyBuilderForm = {
	name:'my-builder-form',
	components:{
		MyBuilderCaption,
		MyBuilderFields,
		MyBuilderFormFunctions,
		MyBuilderFormStates,
		MyBuilderIconInput,
		MyBuilderQuery
	},
	template:`<div class="builder-form" v-if="form">
	
		<!-- form builder main area -->
		<div class="contentBox builder-form-main">
			
			<div class="builder-form-content" v-show="!showStatesFull || !showStates">
				<div class="top">
					<div class="area nowrap">
						<my-builder-icon-input
							@input="iconId = $event"
							:icon-id-selected="iconId"
							:module="module"
							:title="capApp.icon"
						/>
						<my-builder-caption class="title"
							v-model="captions.formTitle"
							:contentName="capApp.formTitle"
							:language="builderLanguage"
						/>
					</div>
					
					<div class="area">
						<my-button
							@trigger="showSidebar = !showSidebar"
							:darkBg="true"
							:image="showSidebar ? 'toggleRight.png' : 'toggleLeft.png'"
						/>
					</div>
				</div>
				<div class="top lower">
					<div class="area nowrap">
						<my-button image="save.png"
							@trigger="set"
							:active="hasChanges"
							:caption="capGen.button.save"
							:darkBg="true"
						/>
						<my-button image="refresh.png"
							@trigger="reset"
							:active="hasChanges"
							:caption="capGen.button.refresh"
							:darkBg="true"
						/>
						<my-button image="open.png"
							@trigger="open"
							:caption="capGen.button.open"
							:darkBg="true"
						/>
						<my-button
							@trigger="showCaptions = !showCaptions"
							:caption="capApp.captions"
							:darkBg="true"
							:image="showCaptions ? 'visible1.png' : 'visible0.png'"
						/>
						<my-button
							@trigger="showFunctions = !showFunctions"
							:caption="capApp.showFunctions"
							:darkBg="true"
							:image="showFunctions ? 'visible1.png' : 'visible0.png'"
						/>
						<my-button
							@trigger="showStates = !showStates"
							:caption="capApp.showStates"
							:darkBg="true"
							:image="showStates ? 'visible1.png' : 'visible0.png'"
						/>
						<my-button
							@trigger="showHelp = !showHelp"
							:caption="capApp.showHelp"
							:darkBg="true"
							:image="showHelp ? 'visible1.png' : 'visible0.png'"
						/>
					</div>
				</div>
				
				<!-- form builder fields -->
				<my-builder-fields class="builder-form-fields default-inputs" flexDirParent="column"
					v-if="!showHelp"
					@fields-set="fields = $event"
					@field-column-query-set="(...args) => setFieldColumnQuery(args[0],args[1])"
					@field-counter-set="fieldCounter = $event"
					@field-id-query-set="setFieldColumnQuery($event,null)"
					@field-move-store="fieldMoveStore"
					@field-remove="removeById($event,'field')"
					:builderLanguage="builderLanguage"
					:columnIdQuery="columnIdQuery"
					:dataFields="dataFields"
					:fieldCounter="fieldCounter"
					:fieldIdMapRef="fieldIdMapRef"
					:fieldIdQuery="fieldIdQuery"
					:fieldMoveList="fieldMoveList"
					:fieldMoveIndex="fieldMoveIndex"
					:fields="fields"
					:formId="id"
					:isTemplate="false"
					:joinsIndexMap="joinsIndexMap"
					:moduleId="form.moduleId"
					:showCaptions="showCaptions"
				/>
				
				<!-- form context help -->
				<my-builder-caption
					v-if="showHelp"
					v-model="captions.formHelp"
					:contentName="capApp.formHelp"
					:language="builderLanguage"
					:richtext="true"
				/>
			</div>
			
			<!-- form functions -->
			<my-builder-form-functions
				v-if="showFunctions"
				v-model="functions"
				@close="showFunctions = false"
				:formId="form.id"
			/>
			
			<!-- form states -->
			<my-builder-form-states
				v-if="showStates"
				v-model="states"
				@close="showStates = false"
				@set-fullscreen="showStatesFull = !showStatesFull"
				:fieldIdMapRef="fieldIdMapRef"
				:form="form"
				:fullscreen="showStatesFull"
			/>
		</div>
		
		<div class="contentBox sidebar scroll" v-if="showSidebar">
		
			<!-- form builder sidebar -->
			<div class="top">
				<div class="area">
					<img class="icon" src="images/database.png" />
					<h1 v-if="showFieldQuery">{{ capApp.contentField }}</h1>
					<h1 v-if="!showFieldQuery">{{ capApp.content }}</h1>
				</div>
				<div class="area">
					<my-button image="cancel.png"
						v-if="showFieldQuery"
						@trigger="fieldIdQuery = null"
						:cancel="true"
						:darkBg="true"
					/>
				</div>
			</div>
			
			<div class="top lower" v-if="settings.compact" />
			
			<div class="content grow" v-if="showFieldQuery">
				
				<!-- field query (lists, relationship inputs, calendars, charts, ...) -->
				<my-builder-query
					@index-removed="fieldQueryRemoveIndex($event)"
					@set-choices="fieldQuerySet('choices',$event)"
					@set-filters="fieldQuerySet('filters',$event)"
					@set-fixed-limit="fieldQuerySet('fixedLimit',$event)"
					@set-joins="fieldQuerySet('joins',$event)"
					@set-lookups="fieldQuerySet('lookups',$event)"
					@set-orders="fieldQuerySet('orders',$event)"
					@set-relation-id="fieldQuerySet('relationId',$event)"
					:allowLookups="fieldQueryEdit.content === 'list' && fieldQueryEdit.csvImport"
					:allowOrders="true"
					:builderLanguage="builderLanguage"
					:choices="fieldQueryEdit.query.choices"
					:fieldIdMap="fieldIdMap"
					:fieldIdMapRef="fieldIdMapRef"
					:filters="fieldQueryEdit.query.filters"
					:fixedLimit="fieldQueryEdit.query.fixedLimit"
					:joins="fieldQueryEdit.query.joins"
					:moduleId="module.id"
					:orders="fieldQueryEdit.query.orders"
					:lookups="fieldQueryEdit.query.lookups"
					:relationId="fieldQueryEdit.query.relationId"
					:relationIdStart="fieldQueryRelationIdStart"
				/>
				
				<template v-if="showColumnQuery">
					<!-- field column sub query -->
					<br /><br />
					<div class="row">
						<my-button image="database.png"
							:active="false"
							:caption="capApp.contentColumn"
							:large="true"
							:naked="true"
						/>
					</div>
					
					<my-builder-query
						@set-choices="fieldColumnQuerySet('choices',$event)"
						@set-filters="fieldColumnQuerySet('filters',$event)"
						@set-fixed-limit="fieldColumnQuerySet('fixedLimit',$event)"
						@set-joins="fieldColumnQuerySet('joins',$event)"
						@set-lookups="fieldColumnQuerySet('lookups',$event)"
						@set-orders="fieldColumnQuerySet('orders',$event)"
						@set-relation-id="fieldColumnQuerySet('relationId',$event)"
						:allowChoices="false"
						:allowOrders="true"
						:builderLanguage="builderLanguage"
						:choices="columnQueryEdit.query.choices"
						:fieldIdMap="fieldIdMap"
						:fieldIdMapRef="fieldIdMapRef"
						:filters="columnQueryEdit.query.filters"
						:fixedLimit="columnQueryEdit.query.fixedLimit"
						:joins="columnQueryEdit.query.joins"
						:joinsParents="[fieldQueryEdit.query.joins]"
						:orders="columnQueryEdit.query.orders"
						:lookups="columnQueryEdit.query.lookups"
						:moduleId="module.id"
						:relationId="columnQueryEdit.query.relationId"
					/>
				</template>
			</div>
			
			<div class="content grow" v-if="!showFieldQuery">
				
				<!-- form record query -->
				<my-builder-query
					@index-removed="removeDataFields(fields,$event)"
					@set-choices="choices = $event"
					@set-filters="filters = $event"
					@set-joins="joins = $event"
					@set-lookups="lookups = $event"
					@set-orders="orders = $event"
					@set-relation-id="relationId = $event"
					:allowChoices="false"
					:allowFixedLimit="false"
					:builderLanguage="builderLanguage"
					:choices="choices"
					:filters="filters"
					:fixedLimit="0"
					:joins="joins"
					:lookups="lookups"
					:moduleId="form.moduleId"
					:orders="orders"
					:relationId="relationId"
				/>
				
				<!-- template fields -->
				<div class="templates-wrap">
					<div class="content-row default-inputs">
						<h2>{{ capApp.fields }}</h2>
						
						<div class="templates-filter">
							<my-bool caption0="n:1" caption1="n:1" v-model="showTemplateN1" />
							<my-bool caption0="1:n" caption1="1:n" v-model="showTemplate1n" />
							<my-bool caption0="n:m" caption1="n:m" v-model="showTemplateNm" />
							<select v-model="templateIndex" class="short">
								<option value="-1">{{ capGen.option.all }}</option>
								<option v-for="j in joinsIndexMap" :value="j.index">
									{{ j.index }})
								</option>
							</select>
						</div>
					</div>
					
					<div class="templates">
						<my-builder-fields flexDirParent="column"
							@field-counter-set="fieldCounter = $event"
							@field-move-store="fieldMoveStore"
							:builderLanguage="builderLanguage"
							:fields="fieldsTemplate"
							:fieldMoveList="fieldMoveList"
							:fieldMoveIndex="fieldMoveIndex"
							:fieldCounter="fieldCounter"
							:formId="id"
							:isTemplate="true"
							:template1n="showTemplate1n"
							:templateIndex="parseInt(templateIndex)"
							:templateN1="showTemplateN1"
							:templateNm="showTemplateNm"
						/>
					</div>
				</div>
			</div>
		</div>
	</div>`,
	props:{
		builderLanguage:{ type:String, required:true },
		id:             { type:String, required:false, default:'' }
	},
	data:function() {
		return {
			// form data
			iconId:null,       // form icon
			captions:{},       // form captions
			fields:[],         // all fields (nested within each other)
			functions:[],      // all functions
			states:[],         // all states
			fieldIdsRemove:[], // IDs of fields to remove
			
			// form data from query
			relationId:'', // source relation ID
			joins:[],      // joined relations, incl. source relation
			filters:[],
			orders:[],
			lookups:[],
			choices:[],
			
			// state
			columnIdQuery:null,
			fieldCounter:0,      // counter to generate unique IDs for all fields
			                     // used to populate new fields and for template fields
			fieldIdQuery:null,   // field ID of which query is currently being edited
			fieldMoveList:null,  // fields list from which to move field (move by click)
			fieldMoveIndex:0,    // index of field which to move (move by click)
			showCaptions:true,   // show caption inputs on non-container fields
			showFunctions:false, // show form functions
			showHelp:false,      // show form context help
			showSidebar:true,    // show form Builder sidebar
			showStates:false,    // show form states
			showStatesFull:false,// sub content (states/functions) are full screen
			showTemplate1n:false,// show templates for 1:n relationship input fields
			showTemplateN1:true, // show templates for n:1 relationship input fields
			showTemplateNm:false,// show templates for n:m relationship input fields
			templateIndex:'-1'
		};
	},
	computed:{
		// entities
		relation:function() {
			return typeof this.relationIdMap[this.relationId] === 'undefined'
				? false : this.relationIdMap[this.relationId];
		},
		form:function() {
			return typeof this.formIdMap[this.id] === 'undefined'
				? false : this.formIdMap[this.id];
		},
		
		hasChanges:function() {
			return this.fieldIdsRemove.length     !== 0
				|| this.iconId                    !== this.form.iconId
				|| JSON.stringify(this.captions)  !== JSON.stringify(this.form.captions)
				|| JSON.stringify(this.fields)    !== JSON.stringify(this.form.fields)
				|| JSON.stringify(this.functions) !== JSON.stringify(this.form.functions)
				|| JSON.stringify(this.states)    !== JSON.stringify(this.form.states)
				|| this.relationId                !== this.form.query.relationId
				|| JSON.stringify(this.joins)     !== JSON.stringify(this.form.query.joins)
				|| JSON.stringify(this.filters)   !== JSON.stringify(this.form.query.filters)
				|| JSON.stringify(this.orders)    !== JSON.stringify(this.form.query.orders)
				|| JSON.stringify(this.lookups)   !== JSON.stringify(this.form.query.lookups)
				|| JSON.stringify(this.choices)   !== JSON.stringify(this.form.query.choices)
			;
		},
		dataFields:function() {
			return this.getDataFields(this.fields);
		},
		columnIdMap:function() {
			let map = {};
			let collect = function(fields) {
				for(let i = 0, j = fields.length; i < j; i++) {
					
					let f = fields[i];
					
					if(f.content === 'container') {
						collect(f.fields);
						continue;
					}
					
					if(typeof f.columns !== 'undefined') {
						for(let x = 0, y = f.columns.length; x < y; x++) {
							map[f.columns[x].id] = f.columns[x];
						}
					}
				}
			};
			collect(this.fields);
			return map;
		},
		columnQueryEdit:function() {
			return this.columnIdQuery === null
				? false : this.columnIdMap[this.columnIdQuery];
		},
		fieldIdMapRef:function() {
			// unique field reference counter for all fields (mapped by field ID)
			let refs = {};
			let refCounter = 0;
			
			let collect = function(fields) {
				for(let i = 0, j = fields.length; i < j; i++) {
					
					let f = fields[i];
					refs[f.id] = refCounter++;
					
					if(f.content === 'container')
						collect(f.fields);
				}
			};
			collect(this.fields);
			return refs;
		},
		fieldIdMap:function() {
			let map = {};
			let collect = function(fields) {
				for(let i = 0, j = fields.length; i < j; i++) {
					
					let f = fields[i];
					map[f.id] = f;
					
					if(f.content === 'container')
						collect(f.fields);
				}
			};
			collect(this.fields);
			return map;
		},
		fieldsTemplate:{
			get:function() {
				if(!this.form)
					return [];
				
				let fields = [];
				
				// relation-independent fields
				fields.push(this.createFieldContainer()); // container
				fields.push(this.createFieldList());      // list
				fields.push(this.createFieldCalendar());  // calendar
				fields.push(this.createFieldChart());     // chart
				fields.push(this.createFieldHeader());    // header
				fields.push(this.createFieldButton());    // button
				
				// data fields from relations
				if(this.relation) {
					for(let i = 0, j = this.joins.length; i < j; i++) {
						let join = this.joins[i];
						
						fields = fields.concat(this.createFieldsForRelation(
							this.relationIdMap[join.relationId],join.index));
					}
				}
				return fields;
			},
			set:function() {} // cannot be set
		},
		indexAttributeIdsUsed:function() {
			let that = this;
			let getIndexIds = function(fields) {
				let indexIds = [];
				
				for(let i = 0, j = fields.length; i < j; i++) {
					let f = fields[i];
					
					switch(f.content) {
						case 'data':
							let atrIdNm = typeof f.attributeIdNm !== 'undefined' ? f.attributeIdNm : null;
						
							indexIds.push(that.getIndexAttributeId(
								f.index,f.attributeId,f.outsideIn === true,atrIdNm
							));
						break;
						case 'container':
							indexIds = indexIds.concat(getIndexIds(f.fields));
						break;
					}
				}
				return indexIds;
			};
			return getIndexIds(this.fields);
		},
		fieldQueryEdit:function() {
			if(this.fieldIdQuery === null) return false;
			
			return this.fieldIdMap[this.fieldIdQuery];
		},
		fieldQueryRelationIdStart:function() {
			if(this.fieldQueryEdit.content !== 'data')
				return null;
			
			let atr = this.attributeIdMap[this.fieldQueryEdit.attributeId];
			
			if(this.fieldQueryEdit.attributeIdNm !== null)
				return this.attributeIdMap[this.fieldQueryEdit.attributeIdNm].relationshipId;
			
			if(this.joinsIndexMap[this.fieldQueryEdit.index].relationId === atr.relationId)
				return atr.relationshipId;
			
			return atr.relationId;
		},
		
		// simple
		joinsIndexMap:  function() { return this.getJoinsIndexMap(this.joins); },
		showColumnQuery:function() { return this.columnQueryEdit !== false; },
		showFieldQuery: function() { return this.fieldQueryEdit !== false; },
		
		// stores
		module:        function() { return this.moduleIdMap[this.form.moduleId]; },
		moduleIdMap:   function() { return this.$store.getters['schema/moduleIdMap']; },
		relationIdMap: function() { return this.$store.getters['schema/relationIdMap']; },
		attributeIdMap:function() { return this.$store.getters['schema/attributeIdMap']; },
		formIdMap:     function() { return this.$store.getters['schema/formIdMap']; },
		settings:      function() { return this.$store.getters.settings; },
		capApp:        function() { return this.$store.getters.captions.builder.form; },
		capFldTitle:   function() { return this.$store.getters.captions.fieldTitle; },
		capFldHelp:    function() { return this.$store.getters.captions.fieldHelp; },
		capGen:        function() { return this.$store.getters.captions.generic; }
	},
	watch:{
		form:{
			handler:function() { this.reset(); },
			immediate:true
		}
	},
	methods:{
		// externals
		getDataFields,
		getFormRoute,
		getIndexAttributeId,
		getJoinsIndexMap,
		getNilUuid,
		getQueryTemplate,
		isAttributeRelationship,
		isAttributeRelationshipN1,
		
		// actions
		open:function() {
			this.$router.push(this.getFormRoute(this.form.id,0,false));
		},
		fieldMoveStore:function(evt) {
			this.fieldMoveList  = evt.fieldList;
			this.fieldMoveIndex = evt.fieldIndex;
		},
		showMessage:function(msg) {
			this.$store.commit('dialog',{
				captionBody:msg,
				buttons:[{
					caption:this.capGen.button.close,
					cancel:true,
					image:'cancel.png'
				}]
			});
		},
		reset:function() {
			if(!this.form) return;
			
			this.iconId     = this.form.iconId;
			this.relationId = this.form.query.relationId;
			this.captions   = JSON.parse(JSON.stringify(this.form.captions));
			this.fields     = JSON.parse(JSON.stringify(this.form.fields));
			this.functions  = JSON.parse(JSON.stringify(this.form.functions));
			this.states     = JSON.parse(JSON.stringify(this.form.states));
			this.joins      = JSON.parse(JSON.stringify(this.form.query.joins));
			this.filters    = JSON.parse(JSON.stringify(this.form.query.filters));
			this.orders     = JSON.parse(JSON.stringify(this.form.query.orders));
			this.lookups    = JSON.parse(JSON.stringify(this.form.query.lookups));
			this.choices    = JSON.parse(JSON.stringify(this.form.query.choices));
			this.fieldIdsRemove  = [];
			this.columnIdQuery   = null;
			this.fieldIdQuery    = null;
		},
		
		createFieldButton:function() {
			return {
				id:'template_button',
				iconId:null,
				content:'button',
				state:'default',
				openForm:null,
				onMobile:true,
				captions:{
					fieldTitle:{}
				}
			};
		},
		createFieldCalendar:function() {
			return {
				id:'template_calendar',
				iconId:null,
				content:'calendar',
				state:'default',
				onMobile:true,
				attributeIdDate0:null,
				attributeIdDate1:null,
				attributeIdColor:null,
				indexDate0:null,
				indexDate1:null,
				indexColor:null,
				gantt:false,
				ganttSteps:null,
				ics:false,
				dateRange0:0,
				dateRange1:0,
				openForm:null,
				query:this.getQueryTemplate(),
				columns:[]
			};
		},
		createFieldChart:function() {
			return {
				id:'template_chart',
				iconId:null,
				content:'chart',
				state:'default',
				onMobile:true,
				chartOption:JSON.stringify({
					dataset:{
						source:['filled by app'],
						sourceHeader:false
					},
					legend: {
						orient:'vertical',
						left:'left',
						type:'scroll'
					},
					series:[],
					toolbox:{
						feature:{
							saveAsImage:{ show:true }
						}
					},
					tooltip:{
						trigger:'item'
					},
					xAxis:{
						position:'bottom',
						type:'category'
					},
					yAxis:{
						position:'left',
						type:'value'
					}
				},null,2),
				query:this.getQueryTemplate(),
				columns:[]
			};
		},
		createFieldContainer:function() {
			return {
				id:'template_container',
				iconId:null,
				content:'container',
				state:'default',
				onMobile:true,
				fields:[],
				direction:'column',
				justifyContent:'flex-start',
				alignItems:'stretch',
				alignContent:'stretch',
				wrap:false,
				grow:1,
				shrink:0,
				basis:0,
				perMin:50,
				perMax:150
			};
		},
		createFieldData:function(index,attribute,outsideIn,attributeIdNm) {
			let field = {
				id:'template_data_'+this.getIndexAttributeId(
					index,attribute.id,outsideIn,attributeIdNm
				),
				iconId:null,
				content:'data',
				state:'default',
				onMobile:true,
				attributeId:attribute.id,
				attributeIdAlt:null, // altern. attribute (used for date period)
				index:index,
				presentation:'',
				display:'default',
				def:'',
				min:null,
				max:null,
				regexCheck:null,
				jsFunctionId:null,
				collectionIdDef:null,
				columnIdDef:null,
				captions:{
					fieldTitle:{},
					fieldHelp:{}
				}
			};
			if(this.isAttributeRelationship(attribute.content)) {
				field.attributeIdNm = attributeIdNm;
				field.columns       = [];
				field.query         = this.getQueryTemplate();
				field.category      = false;
				field.filterQuick   = false;
				field.outsideIn     = outsideIn;
				field.defPresetIds  = [];
				field.openForm      = null;
			}
			return field;
		},
		createFieldHeader:function() {
			return {
				id:'template_header',
				iconId:null,
				content:'header',
				state:'default',
				onMobile:true,
				size:2,
				captions:{
					fieldTitle:{}
				}
			};
		},
		createFieldList:function() {
			return {
				id:'template_list',
				iconId:null,
				content:'list',
				state:'default',
				onMobile:true,
				columns:[],
				autoRenew:null,
				csvExport:false,
				csvImport:false,
				filterQuick:false,
				layout:'table',
				openForm:null,
				query:this.getQueryTemplate(),
				recordSelector:false,
				resultLimit:50
			};
		},
		createFieldsForRelation:function(relation,index) {
			let fields = [];
			// create data fields from all attributes from this relation
			// non-relationship attributes
			for(let i = 0, j = relation.attributes.length; i < j; i++) {
				let atr = relation.attributes[i];
				
				if(!this.indexAttributeIdsUsed.includes(this.getIndexAttributeId(index,atr.id,false,null))
					&& relation.attributeIdPk !== atr.id
					&& !this.isAttributeRelationship(atr.content)
				) {
					fields.push(this.createFieldData(index,atr,false,null));
				}
			}
			
			// relationship attributes
			for(let i = 0, j = relation.attributes.length; i < j; i++) {
				let atr = relation.attributes[i];
				
				if(!this.indexAttributeIdsUsed.includes(this.getIndexAttributeId(index,atr.id,false,null))
					&& this.isAttributeRelationship(atr.content)
				) {
					fields.push(this.createFieldData(index,atr,false,null));
				}
			}
			
			// relationship attributes from outside (1:n)
			for(let relId in this.relationIdMap) {
				let rel = this.relationIdMap[relId];
				
				// only allow relations from own module or modules we declared as dependency
				if(rel.moduleId !== this.module.id && !this.module.dependsOn.includes(rel.moduleId))
					continue;
				
				// relationship attributes referencing this relation (can be self reference)
				for(let i = 0, j = rel.attributes.length; i < j; i++) {
					let atr = rel.attributes[i];
					
					if(atr.relationshipId !== relation.id)
						continue;
					
					if(this.indexAttributeIdsUsed.includes(this.getIndexAttributeId(index,atr.id,true,null)))
						continue;
					
					if(!this.isAttributeRelationship(atr.content))
						continue;
					
					fields.push(this.createFieldData(index,atr,true,null));
				}
				
				// relationship attributes that can be used to build n:m relationships
				let atrsN1 = [];
				for(let i = 0, j = rel.attributes.length; i < j; i++) {
					if(this.isAttributeRelationshipN1(rel.attributes[i].content))
						atrsN1.push(rel.attributes[i]);
				}
				
				for(let i = 0, j = atrsN1.length; i < j; i++) {
					
					// find attributes in relationship with us
					let atr = atrsN1[i];
					if(atr.relationshipId !== relation.id)
						continue;
					
					for(let x = 0, y = atrsN1.length; x < y; x++) {
						let atrNm = atrsN1[x];
						
						// offer n:m together with every other n:1 attribute
						if(atrNm.id === atr.id)
							continue;
						
						if(this.indexAttributeIdsUsed.includes(this.getIndexAttributeId(index,atr.id,true,atrNm.id)))
							continue;
						
						fields.push(this.createFieldData(index,atr,true,atrNm.id));
					}
				}
			}
			return fields;
		},
		removeDataFields:function(fields,index) {
			for(let i = 0, j = fields.length; i < j; i++) {
				let field = fields[i];
				
				if(field.content === 'data' && field.index === index) {
					fields.splice(i,1);
					this.removeById(field.id,'field');
					i--; j--;
					continue;
				}
				
				if(field.content === 'container')
					this.removeDataFields(field.fields,index);
			}
		},
		removeById:function(id,type) {
			if(id.startsWith('new_')) return; // ignore new field/column
			
			switch(type) {
				case 'field': this.fieldIdsRemove.push(id); break;
			}
			
			if(this.fieldIdQuery === id)
				this.fieldIdQuery = null;
		},
		replaceBuilderId:function(fields) {
			for(let i = 0, j = fields.length; i < j; i++) {
				let f = fields[i];
				
				if(f.content === 'container')
					this.replaceBuilderId(f.fields);
				
				if(f.id.startsWith('new_'))
					f.id = this.getNilUuid();
					
				if(typeof f.columns !== 'undefined') {
					
					for(let x = 0, y = f.columns.length; x < y; x++) {
						if(f.columns[x].id.startsWith('new_'))
							f.columns[x].id = this.getNilUuid();
					}
				}
				fields[i] = f;
			}
			return fields;
		},
		
		// field manipulation
		fieldQueryRemoveIndex:function(index) {
			let colsCloned = JSON.parse(JSON.stringify(this.fieldQueryEdit.columns));
			
			for(let i = 0, j = colsCloned.length; i < j; i++) {
				if(colsCloned[i].index === index) {
					colsCloned.splice(i,1);
					i--; j--;
				}
			}
			this.fieldQueryEdit.columns = colsCloned;
		},
		fieldQuerySet:function(name,value) {
			let v = JSON.parse(JSON.stringify(this.fieldQueryEdit.query));
			v[name] = value;
			this.fieldQueryEdit.query = v;
		},
		fieldColumnQuerySet:function(name,value) {
			let v = JSON.parse(JSON.stringify(this.columnQueryEdit.query));
			v[name] = value;
			this.columnQueryEdit.query = v;
		},
		setFieldColumnQuery:function(fieldId,columnId) {
			this.fieldIdQuery  = fieldId;
			this.columnIdQuery = columnId;
		},
		
		// backend calls
		set:function() {
			// replace builder counter ID with empty field UUID for creation
			let fieldsCleaned = this.replaceBuilderId(
				JSON.parse(JSON.stringify(this.fields))
			);
			
			// check removed fields being referenced in form states
			for(let i = 0, j = this.states.length; i < j; i++) {
				let s = this.states[i];
				
				for(let x = 0, y = s.conditions.length; x < y; x++) {
					let c = s.conditions[x];
					
					if(this.fieldIdsRemove.includes(c.fieldId0) || this.fieldIdsRemove.includes(c.fieldId1))
						return this.showMessage(this.capApp.error.formStateFieldRemovedCondition.replace('{NAME}',s.description));
				}
				
				for(let x = 0, y = s.effects.length; x < y; x++) {
					let e = s.effects[x];
					
					if(this.fieldIdsRemove.includes(e.fieldId))
						return this.showMessage(this.capApp.error.formStateFieldRemovedEffect.replace('{NAME}',s.description));
				}
			}
			
			// save form and delete removed fields
			let requests = [];
			for(let i = 0, j = this.fieldIdsRemove.length; i < j; i++) {
				requests.push(ws.prepare('field','del',{id:this.fieldIdsRemove[i]}));
			}
			
			requests.push(ws.prepare('form','set',{
				id:this.form.id,
				moduleId:this.form.moduleId,
				presetIdOpen:this.form.presetIdOpen,
				iconId:this.iconId,
				name:this.form.name,
				noDataActions:this.form.noDataActions,
				query:{
					id:this.form.query.id,
					relationId:this.relationId,
					joins:this.joins,
					filters:this.filters,
					orders:this.orders
				},
				fields:fieldsCleaned,
				functions:this.functions,
				states:this.states,
				captions:this.captions
			}));
			requests.push(ws.prepare('schema','check',{
				moduleId:this.form.moduleId
			}));
			
			ws.sendMultiple(requests,true).then(
				() => this.$root.schemaReload(this.module.id),
				this.$root.genericError
			);
		}
	}
};