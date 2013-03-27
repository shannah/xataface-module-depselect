<?php
/*
 * Xataface Depselect Module
 * Copyright (C) 2011  Steve Hannah <steve@weblite.ca>
 * 
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Library General Public
 * License as published by the Free Software Foundation; either
 * version 2 of the License, or (at your option) any later version.
 * 
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Library General Public License for more details.
 * 
 * You should have received a copy of the GNU Library General Public
 * License along with this library; if not, write to the
 * Free Software Foundation, Inc., 51 Franklin St, Fifth Floor,
 * Boston, MA  02110-1301, USA.
 *
 */
 
/**
 * @brief An HTTP REST action to load the options for a particular depselect field.  Returns JSON
 * data.
 *
 * @section rest REST Interface
 *
 * @param string -table The name of the table where the depselect field resides.
 * @param string -field The name of the depselect field.
 * @return JSON A JSON data structure of the following form:
 * @code
 * {
 *     code: <int>,			// The status code.  200 for success
 *     message: <string>, 	// String message.  Useful if there is an error.
 *     values: <Object>		// A JSON object with the options to be returned.
 * }
 * @endcode
 *
 * @subsection statuscodes Status Codes
 *
 * <table>
 *		<tr>
 *			<th>Code</th>
 *			<th>Meaning</th>
 *		</tr>
 *		<tr>
 *			<td>200</th>
 *			<td>Success.  The values should be contained in the 'values' property.</td>
 *		</tr>
 *		<tr>
 *			<td>401</td>
 *			<td>Permission Denied.  The user doesn't have permission to access these values.  In order
 *				to access this action, the user must either have edit or new permission on the 
 *				source table (i.e. the table containing the depselect field).
 *			</td>
 *		</tr>
 *		<tr>
 *			<td>500</td>
 *			<td>Server Error or Configuration Error.  Check the server error log for details.</td>
 *		</tr>
 *	</table>
 *
 * @subsection samplevalues Sample Values Object
 *
 * The "values" property will be an object with just key values pairs, where the key
 * is the id that is meant to be stored in the database.  The value is the label that is
 * displayed to the user.  E.g.
 *
 * @code
 * {
 *     1: 'Option #1',
 *     2: 'Option #2',
 *	.. etc...
 * }
 * @endcode
 */
class actions_depselect_load {


	/**
	 * @brief Returns  the default error message for when a server error has occurred.
	 * @param string $fieldname The name of the depselect field on which the error occurred.
	 * @return string The full error message.
	 */
	static function errorMessage($fieldname){
	
		return "Failed to load values for field '".$fieldname."'.  See server error log for details.";
	}

	/**
	 * @brief Handles the HTTP request.  Outputs the JSON response.
	 */
	function handle($params){
	
		session_write_close();
		header('Connection: close');
		
		$app = Dataface_Application::getInstance();
		$query = $app->getQuery();
		$tableName = $query['-table'];
		if ( @$query['--depselect-table'] ){
		    $tableName = $query['--depselect-table'];
		}
		$table = Dataface_Table::loadTable($tableName);
		$field = $table->getField($query['-field']);
		//$table = Dataface_Table::loadTable($field['widget']['table']);
		$this->loadFromTable($table, $field, $query);
		
	}
	
	
	/**
	 * @brief Loads the values for a particular field in a particular table.
	 *
	 * This method is delegated to by handle() for cleanliness purposes.
	 *
	 * @param Dataface_Table $table The table where the depselect field resides.
	 * @param array &$field The field definition of the depselect field.
	 * @param array $query The current GET parameters.
	 * 
	 */
	private function loadFromTable(Dataface_Table $table, &$field, $query){
		
		try {
			
			$perms = $table->getPermissions(array('field'=>$field['name']));
			if ( !@$perms['edit'] and !@$perms['new'] ){
				// The user doesn't have permission to edit the column... so we 
				// need to cut off access right now!!!
				error_log("Insufficient permissions to access field $field[name] by current user.");
				throw new Exception("Failed to get options for field $filed[name] because you don't have view permission for this field.", 401);
			
			}
			
			
			
			
			if ( !@$field['widget']['table'] ){
				error_log("widget:table not defined for field ".$field['name']." of table ".$table->tablename.".");
				throw new Exception(self::errorMessage($fieldname), 500);
			}
			$targetTable = Dataface_Table::loadTable($field['widget']['table']);
			
			$filters = array();
			if ( @$field['widget']['filters']  and is_array($field['widget']['filters'])){
				foreach ($field['widget']['filters'] as $key=>$val){
					if ( isset($query[$key]) ){
						$filters[$key]=$query[$key];
					} else if ( strpos($val,'$') === 0 ){
						$filters[$key] = '=';
					} else {
						$filters[$key] = $val;
					}
				}
			}
			
			
			
			$limit = 250;
			if ( @$field['widget']['limit'] ){
				$limit = intval($field['widget']['limit']);
			}
			
			$filters['-limit'] = $limit;
			$records = df_get_records_array($field['widget']['table'], $filters);
			//if ( count($filters) > 1 ){
			//	echo "Num records found: ".count($records);
			//	print_r($filters);
			//}
			$keyCol = null;
			$labelCol = null;
			
			if ( @$field['widget']['keycol'] ){
				$keyCol = $field['widget']['keycol'];
			} else {
				foreach ($targetTable->keys() as $k=>$v){
					$keyCol = $k;
					break;
				}
			}
			
			if ( @$field['widget']['labelcol'] ){
				$labelCol = $field['widget']['labelcol'];
			}
			
			$out = array();
			foreach ($records as $r){
				if ( @$field['widget']['ignore_permissions'] ){
					$r->secureDisplay = false;
				} else {
					//if ( !$r->checkPermission('view') ) continue;
					if ( !$r->checkPermission('view', array('field'=>$keyCol))) continue;
					if ( $labelCol and !$r->checkPermission('view', array('field'=>$labelCol))) continue;
				}
				
				if ( $labelCol ){
					$temp = array (
						($r->val($keyCol))=>($r->display($labelCol))
					);
					
				} else {
					$temp = array (
						($r->val($keyCol))=>($r->getTitle())
					);
				}
				$out[] = $temp;
				
			
			}
			
			$this->out(array(
				'code'=>200,
				'message'=>'Received default valuelist',
				'values'=>$out
			));
			exit;
			
		
		} catch (Exception $ex){
		
			$this->out(array(
				'code'=>$ex->getCode(),
				'message'=>$ex->getMessage()
			));
			exit;
		}
	
	}
	
	
	/**
	 * @brief Outputs content as JSON.  Outputs headers as necessary.
	 */
	private function out($params){
		header('Content-type: text/json; charset="'.Dataface_Application::getInstance()->_conf['oe'].'"');
		echo json_encode($params);
	}
	
	
	
}